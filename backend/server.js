const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
// 🚨 NOVOS REQUIRES:
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// ------------------

dotenv.config();

const corsOptions = {
    // Permite requisições da porta 5173, que é o padrão do Vite
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Crucial para o JWT
    optionsSuccessStatus: 204
};

const app = express();
app.use(bodyParser.json());
// 1. Aplica o CORS CORRETO
app.use(cors(corsOptions));

// -------------------------------------------------------------
// 🚨 CONFIGURAÇÃO CRÍTICA DO MULTER (POSIÇÃO CORRETA) 🚨
// -------------------------------------------------------------

const SECRET_KEY = process.env.SECRET_KEY || 'BARBERIA-SECRET-KEY'; 

// --- Configuração de Upload (Multer) ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log('Diretório de uploads criado.');
}

// Configuração de Armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Salva na pasta 'uploads'
    },
    filename: (req, file, cb) => {
        // Renomeia o arquivo para ser único (sem depender de req.user aqui)
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `foto-${uniqueSuffix}${ext}`); 
    }
});

// Middleware para processar o upload de uma única foto de perfil
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
}).single('foto_perfil'); // Nome do campo no frontend

// Rota para servir as imagens estaticamente
app.use('/uploads', express.static(uploadsDir));

// -------------------------------------------------------------

// Conexão com o banco de dados (usando um Pool de Promessas)
const db = mysql.createPool({ 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Teste de conexão:
db.getConnection()
    .then(connection => {
        console.log('Conexão com o banco de dados MySQL estabelecida!');
        connection.release();
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
    });

// Nota: A função getTaxaCartao deve ser atualizada para usar 'db.query' já que agora é um Pool de Promessas.
async function getTaxaCartao(barbeiroId) {
// 🚨 CORRIGIDO: Agora aceita o parâmetro barbeiroId
    try {
        // A consulta usa o ID do barbeiro logado (multi-tenant)
        const [rows] = await db.query('SELECT taxa FROM taxa_cartao WHERE barbeiro_id = ?', [barbeiroId]);
        return parseFloat(rows && rows[0] ? rows[0].taxa : 0.00);
    } catch (e) {
        console.error("Erro ao buscar taxa de cartão no cálculo:", e);
        return 0.00;
    }
}

// Função para formatar a data para SQL (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split('T')[0];

const getStartOfDay = () => {
    const today = new Date();
    // Zera o tempo para 00:00:00 na hora local do servidor (Brasil/Node)
    today.setHours(0, 0, 0, 0); 
    // Formata como string DATETIME do MySQL (Ex: '2025-11-09 00:00:00')
    return today.toISOString().slice(0, 19).replace('T', ' '); 
};

// ==========================================================
// MIDDLEWARE DE AUTENTICAÇÃO (VERIFICA O TOKEN)
// ==========================================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next(); 
    });
};


// ==========================================================
// ROTAS DE AUTENTICAÇÃO (LOGIN/REGISTER/ATIVAÇÃO)
// ==========================================================

// Rota para Cadastro de Novo Usuário (Barbeiro ou Cliente)
app.post('/auth/register', async (req, res) => {
    const { nome, email, password, tipo_usuario } = req.body; 
    
    if (!nome || !email || !password || !tipo_usuario || (tipo_usuario !== 'barbeiro' && tipo_usuario !== 'cliente')) {
        return res.status(400).json({ error: 'Todos os campos, incluindo o tipo de usuário, são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO barbeiros (nome, email, password_hash, tipo_usuario) VALUES (?, ?, ?, ?)';
        
        const [result] = await db.query(sql, [nome, email, hashedPassword, tipo_usuario]);
        
        res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: result.insertId, userName: nome });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email já está em uso.' });
        }
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Rota para Login de Usuário (CHECA O STATUS DE ATIVAÇÃO)
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const sql = 'SELECT id, nome, email, password_hash, tipo_usuario, status_ativacao FROM barbeiros WHERE email = ?';
        const [results] = await db.query(sql, [email]);
        
        const user = results[0];

        if (!user || !user.password_hash) { 
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // 1. BLOQUEIO CRÍTICO: Se o status for PENDENTE
        if (user.status_ativacao === 'pendente' || user.status_ativacao === null) {
            return res.status(403).json({ 
                error: 'Ativação pendente. Por favor, insira sua chave de licença.',
                userId: user.id 
            });
        }
        
        // 2. Compara a Senha
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // 3. Sucesso: Gera o Token
        const token = jwt.sign({ id: user.id, email: user.email, tipo: user.tipo_usuario }, SECRET_KEY, { expiresIn: '1h' });
        
        res.json({ 
            message: 'Login bem-sucedido!', 
            token, 
            userId: user.id, 
            userName: user.nome,
            userType: user.tipo_usuario
        });

    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' }); 
    }
});

// Rota para Ativação de Conta (VERIFICA CHAVE E MUDA STATUS)
app.post('/auth/ativar-conta', async (req, res) => {
    const { userId, chaveAcesso } = req.body;
    
    if (!userId || !chaveAcesso) {
        return res.status(400).json({ error: 'ID do usuário e Chave de Acesso são obrigatórios.' });
    }
    
    const CHAVE_MESTRA_CORRETA = "BAR-BER-APLI-MASTER-ADIMIN25"; 

    try {
        if (chaveAcesso !== CHAVE_MESTRA_CORRETA) {
            return res.status(401).json({ error: 'Chave de acesso inválida. Por favor, verifique.' });
        }

        const sqlUpdate = "UPDATE barbeiros SET status_ativacao = 'ativa' WHERE id = ? AND status_ativacao = 'pendente' AND tipo_usuario = 'barbeiro'";
        const [updateResult] = await db.query(sqlUpdate, [userId]); 

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ error: 'O usuário não está pendente ou não foi encontrado para ativação.' });
        }

        res.status(200).json({ message: 'Conta ativada com sucesso! Você pode fazer login agora.' });

    } catch (err) {
        console.error('Erro fatal na ativação de conta:', err);
        return res.status(500).json({ error: 'Erro interno ao tentar ativar a conta. Verifique o console do servidor.' });
    }
});


// Rota para EXCLUSÃO DA CONTA (Deleta o registro do barbeiro logado)
app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const userEmail = req.user.email;
    
    try {
        const sql = 'DELETE FROM barbeiros WHERE id = ?';
        const [result] = await db.query(sql, [barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Conta não encontrada ou já excluída." });
        }
        
        console.log(`Conta do Barbeiro ${userEmail} (ID: ${barbeiro_id}) excluída com sucesso.`);
        
        return res.status(200).json({ message: "Conta excluída permanentemente. Redirecionando..." });

    } catch (err) {
        console.error('Erro na exclusão de conta (Provável falha de FOREIGN KEY):', err);
        return res.status(500).json({ error: 'Erro interno. Verifique as restrições do banco.' });
    }
});


// ==========================================================
// ROTAS DE PERFIL E CADASTRO OBRIGATÓRIO (COM MULTER INTEGRADO)
// ==========================================================

// Rota para Checar/Buscar o Perfil (GET) - Inclui o campo foto_perfil
app.get('/perfil/barbeiro', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id; 
    
    try {
        // Seleciona a foto_perfil (b.foto_perfil) da tabela barbeiros e junta com o perfil_barbeiro
        const sql = `
            SELECT pb.*, b.nome AS nome_barbeiro_auth, b.email, b.foto_perfil 
            FROM perfil_barbeiro pb
            JOIN barbeiros b ON pb.barbeiro_id = b.id
            WHERE pb.barbeiro_id = ?
        `;
        const [results] = await db.query(sql, [barbeiro_id]);

        if (results.length > 0) {
            return res.json({ profileExists: true, data: results[0] });
        } else {
            // Se o perfil completo não existe, busca a foto e dados básicos de 'barbeiros' para a tela de cadastro
            const [basicInfo] = await db.query('SELECT nome, email, foto_perfil FROM barbeiros WHERE id = ?', [barbeiro_id]);
            return res.json({ profileExists: false, data: basicInfo[0] || {} });
        }

    } catch (err) {
        console.error('Erro ao checar perfil:', err);
        res.status(500).json({ error: 'Erro interno ao checar perfil.' });
    }
});

// Rota para Criar/Atualizar o Perfil do Barbeiro (POST - Usa ON DUPLICATE KEY UPDATE)
app.post('/perfil/barbeiro', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade } = req.body;

    // Validação de campos obrigatórios
    if (!nome_barbeiro || !nome_barbearia || !documento || !telefone || !rua || !numero || !bairro || !cep || !uf || !localidade) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        // SQL FINAL CORRIGIDO: Inclui nome_barbeiro no UPDATE
        const sql = `INSERT INTO perfil_barbeiro (barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                nome_barbeiro = VALUES(nome_barbeiro),
                nome_barbearia = VALUES(nome_barbearia),
                documento = VALUES(documento),
                telefone = VALUES(telefone),
                rua = VALUES(rua),
                numero = VALUES(numero),
                bairro = VALUES(bairro),
                complemento = VALUES(complemento),
                cep = VALUES(cep),
                uf = VALUES(uf),
                localidade = VALUES(localidade)`;
        
        const finalComplemento = complemento === '' ? null : complemento; 

        await db.query(sql, [
            barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, finalComplemento, cep, uf, localidade
        ]);

        res.status(200).json({ message: 'Perfil profissional salvo com sucesso!' });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Este barbeiro já possui um perfil cadastrado.' });
        }
        console.error('Erro ao criar perfil:', err);
        res.status(500).json({ error: 'Erro interno ao salvar perfil.' });
    }
});


// ROTA PARA ATUALIZAR A FOTO E DADOS DO PERFIL
// ROTA PARA ATUALIZAR A FOTO E DADOS DO PERFIL
// ROTA PARA ATUALIZAR A FOTO E DADOS DO PERFIL
// ROTA PARA ATUALIZAR A FOTO E DADOS DO PERFIL
// ROTA PARA ATUALIZAR A FOTO E DADOS DO PERFIL
app.put('/perfil/foto', authenticateToken, (req, res) => {
    
    const barbeiro_id = req.user.id; 
    
    upload(req, res, async (err) => {
        
        if (err || !req.file) { // Se Multer falhar ou o arquivo não vier
            // ... (log de erros e retorna 500/400) ...
            return res.status(400).json({ error: "Nenhum arquivo de foto foi recebido ou erro interno no Multer." });
        }

        let fotoPath = null;
        const oldPath = req.file.path;
        const oldFilename = req.file.filename; 
        
        // 🚨 CRÍTICO: Definindo o novo nome do arquivo com o ID do barbeiro 🚨
        const filenameWithId = `foto-${barbeiro_id}-${oldFilename}`;
        const newPath = path.join(uploadsDir, filenameWithId); 
        
        // Tenta renomear o arquivo
        try {
            fs.renameSync(oldPath, newPath); // AQUI A RENOVEÇÃO OCORRE
            fotoPath = `/uploads/${filenameWithId}`; // Caminho RELATIVO para o DB

        } catch (renameErr) {
            console.error("Falha Crítica ao renomear arquivo (Permissão/Caminho):", renameErr);
            fs.unlink(oldPath, () => {}); // Tenta apagar o arquivo temporário
            return res.status(500).json({ error: "Falha ao processar o arquivo no servidor." });
        }

        // Lógica de deleção da foto antiga (Mantida, pois é correta)
        try {
            const [oldPhotoRow] = await db.query('SELECT foto_perfil FROM barbeiros WHERE id = ?', [barbeiro_id]);
            const oldPhotoPath = oldPhotoRow?.[0]?.foto_perfil;
            if (oldPhotoPath && oldPhotoPath !== fotoPath) {
                const fullPath = path.join(__dirname, oldPhotoPath);
                if (fs.existsSync(fullPath)) { 
                    fs.unlinkSync(fullPath); 
                }
            }
        } catch (cleanupError) {
             console.warn("Aviso: Falha ao deletar foto antiga:", cleanupError.message);
        }
        
        try {
            // 2. Query para atualizar a coluna foto_perfil no DB
            const sql = 'UPDATE barbeiros SET foto_perfil = ? WHERE id = ?';
            await db.query(sql, [fotoPath, barbeiro_id]);

            return res.status(200).json({ 
                message: "Foto de perfil atualizada com sucesso!",
                foto_perfil_url: fotoPath 
            });

        } catch (error) {
            // Se falhar no DB, tenta deletar o arquivo renomeado para limpeza
            if (newPath && fs.existsSync(newPath)) {
                fs.unlink(newPath, (errUnlink) => { }); 
            }
            console.error("Erro ao atualizar DB com a foto:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar perfil." });
        }
    });
});
// ==========================================================
// ROTAS DE MOVIMENTAÇÕES FINANCEIRAS (CONTROLE DE CAIXA)
// ==========================================================
// Aplicando o middleware nas rotas que precisam de autenticação
app.post('/movimentacoes', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    let { descricao, valor, tipo, categoria, forma_pagamento } = req.body;
    valor = parseFloat(valor);

    if (!valor || valor <= 0 || !tipo || !descricao || !forma_pagamento) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    try {
        let valorFinal = valor;
        let categoriaFinal = categoria || 'servico'; 

        // 1. APLICAÇÃO DA TAXA DO CARTÃO (Se for Receita com Cartão)
        if (forma_pagamento === 'cartao' && tipo === 'receita') {
            const taxaPercentual = await getTaxaCartao(barbeiro_id);
            if (taxaPercentual > 0) {
                const taxaValor = valor * (taxaPercentual / 100);
                valorFinal = valor - taxaValor;
                
                // Registra a DESPESA (Taxa) separadamente
                const sqlInsertTaxa = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
                await db.query(sqlInsertTaxa, [
                    barbeiro_id,
                    `Taxa Cartão Ref: ${descricao.substring(0, 50)}`,
                    taxaValor,
                    'despesa',
                    'taxa',
                    'cartao'
                ]);
            }
        }

        // 2. Inserção da Movimentação Principal
        const sqlInsertPrincipal = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sqlInsertPrincipal, [
            barbeiro_id,
            descricao,
            valorFinal,
            tipo,
            categoriaFinal,
            forma_pagamento
        ]);

        return res.status(201).json({ id: result.insertId, message: "Movimentação registrada com sucesso!" });

    } catch (error) {
        console.error("Erro ao registrar movimentação:", error);
        return res.status(500).json({ error: "Erro interno ao salvar movimentação." });
    }
});


// Rota de LISTAGEM DO DIA (GET /movimentacoes)
app.get('/movimentacoes', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    // O código do frontend (Transacoes.jsx) irá aplicar filtros de data, tipo e pagamento.
    // O backend deve apenas garantir a segurança (filtrando por barbeiro_id).

    try {
        // SQL CORRIGIDO: Remove o filtro de data padrão para listar TUDO
        const sql = 'SELECT * FROM movimentacoes_financeiras WHERE barbeiro_id = ? ORDER BY data_hora DESC'; 
        
        // Apenas o ID do barbeiro é passado
        const [rows] = await db.query(sql, [barbeiro_id]); 

        return res.json(rows); 
        
    } catch (error) {
        console.error("Erro ao listar movimentações:", error);
        return res.status(500).json({ error: "Erro interno ao listar." });
    }
});
app.get('/movimentacoes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id;

    try {
        const sql = 'SELECT * FROM movimentacoes_financeiras WHERE id = ? AND barbeiro_id = ?';
        const [movimentacao] = await db.query(sql, [id, barbeiro_id]);

        if (movimentacao.length === 0) {
            return res.status(404).json({ error: "Movimentação não encontrada ou acesso negado." });
        }

        // Retorna o primeiro (e único) resultado
        return res.json(movimentacao[0]);

    } catch (error) {
        console.error("Erro ao buscar detalhe da movimentação:", error);
        res.status(500).json({ error: "Erro interno ao buscar detalhe." });
    }
});


// Rota de EDIÇÃO (PUT /movimentacoes/:id)
app.put('/movimentacoes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id;
    const { descricao, valor, tipo, categoria, forma_pagamento } = req.body;
    
    // Validação básica
    if (!valor || !tipo) {
        return res.status(400).json({ error: "Valor e tipo são obrigatórios para edição." });
    }
    
    try {
        const sql = `UPDATE movimentacoes_financeiras SET descricao = ?, valor = ?, tipo = ?, categoria = ?, forma_pagamento = ? WHERE id = ? AND barbeiro_id = ?`;
        const [result] = await db.query(sql, [
            descricao,
            parseFloat(valor),
            tipo,
            categoria,
            forma_pagamento,
            id,
            barbeiro_id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Movimentação não encontrada ou você não tem permissão para editar." });
        }

        res.status(200).json({ message: "Movimentação atualizada com sucesso." });

    } catch (error) {
        console.error("Erro ao atualizar movimentação:", error);
        res.status(500).json({ error: "Erro interno ao atualizar movimentação." });
    }
});

// Rota de EXCLUSÃO (DELETE /movimentacoes/:id)
app.delete('/movimentacoes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id;

    try {
        const sql = 'DELETE FROM movimentacoes_financeiras WHERE id = ? AND barbeiro_id = ?';
        const [result] = await db.query(sql, [id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Movimentação não encontrada ou você não tem permissão para excluir." });
        }

        res.status(200).json({ message: "Movimentação excluída com sucesso." });

    } catch (error) {
        console.error("Erro ao excluir movimentação:", error);
        res.status(500).json({ error: "Erro interno ao excluir movimentação." });
    }
});

app.get('/saldo', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const startOfDay = getStartOfDay();

    try {
        // SQL em linha e limpo
        const sql = "SELECT SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) - SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as saldo_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND data_hora >= ?";
        
        const [rows] = await db.query(sql, [barbeiro_id, startOfDay]); 
        const resultado = rows[0]; // Certifique-se de que é a linha de dados

        return res.json({
            saldo_total: parseFloat(resultado.saldo_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular saldo:", error);
        return res.status(500).json({ error: "Erro interno." });
    }
});


app.get('/totais/diarios', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const startOfDay = getStartOfDay();

    try {
        // SQL em linha e limpo (Corrigido o problema de sintaxe)
        const sql = "SELECT SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita_total, SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND data_hora >= ?";
        
        const [rows] = await db.query(sql, [barbeiro_id, startOfDay]);
        const resultado = rows[0];

        return res.json({
            receita_total: parseFloat(resultado.receita_total || 0).toFixed(2),
            despesa_total: parseFloat(resultado.despesa_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular totais diários:", error);
        return res.status(500).json({ error: "Erro interno." });
    }
});


// --- Rota 1: GET /taxa-cartao (Busca a taxa do barbeiro logado) ---
app.get('/taxa-cartao', authenticateToken, async (req, res) => {
    // 1. Usa o ID do barbeiro logado
    const barbeiro_id = req.user.id; 

    try {
        const sql = 'SELECT taxa FROM taxa_cartao WHERE barbeiro_id = ?';
        const [rows] = await db.query(sql, [barbeiro_id]);

        // 2. Retorna a taxa ou 0.00 se o registro ainda não existir
        const taxa = rows && rows[0] ? parseFloat(rows[0].taxa) : 0.00;
        
        return res.json({ taxa: taxa }); 

    } catch (error) {
        console.error("Erro ao buscar taxa de cartão:", error);
        return res.status(500).json({ error: "Erro interno ao buscar taxa." });
    }
});

// --- Rota 2: PUT /taxa-cartao (Salva/Atualiza a taxa do barbeiro logado) ---
app.put('/taxa-cartao', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { taxa } = req.body; 

    const taxaNumerica = parseFloat(taxa);
    if (isNaN(taxaNumerica) || taxaNumerica < 0) {
        return res.status(400).json({ error: "Taxa inválida. Use um número positivo." });
    }

    try {
        // Usa INSERT INTO ... ON DUPLICATE KEY UPDATE para garantir que insere OU atualiza
        const sql = `
            INSERT INTO taxa_cartao (barbeiro_id, taxa) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE taxa = VALUES(taxa)
        `;
        await db.query(sql, [barbeiro_id, taxaNumerica]);

        return res.status(200).json({ message: "Taxa de cartão atualizada com sucesso!" });
        
    } catch (error) {
        console.error("Erro ao atualizar taxa de cartão:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar taxa." });
    }
});

// Função auxiliar para buscar a taxa individual do barbeiro
async function getTaxaCartao(barbeiroId) { 
    try {
        // Busca a taxa usando o ID do barbeiro
        const [rows] = await db.query('SELECT taxa FROM taxa_cartao WHERE barbeiro_id = ?', [barbeiroId]);
        // Retorna a taxa como float, ou 0.00 se não houver registro
        return parseFloat(rows && rows[0] ? rows[0].taxa : 0.00); 
    } catch (e) {
        console.error("Erro ao buscar taxa de cartão no cálculo:", e);
        return 0.00;
    }
}
// server.js (Rota para Relatório Mensal - Cerca da Linha 480)
// server.js (Rota para Relatório Mensal)
app.get('/relatorio/mensal/:ano/:mes', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { ano, mes } = req.params;

    // Constrói o início do mês atual (Ex: '2025-05-01 00:00:00')
    const startOfMonth = `${ano}-${mes.padStart(2, '0')}-01 00:00:00`;
    
    // Constrói o início do próximo mês para usar como data final do filtro
    const dataProximoMes = new Date(parseInt(ano), parseInt(mes), 1);
    const endOfMonth = dataProximoMes.toISOString().slice(0, 19).replace('T', ' ');

    try {
        const sql = `SELECT SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita_total, SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND data_hora >= ? AND data_hora < ?`;
        const [rows] = await db.query(sql, [barbeiro_id, startOfMonth, endOfMonth]);
        const resultado = rows[0];

        return res.json({
            receita_total: parseFloat(resultado.receita_total || 0).toFixed(2),
            despesa_total: parseFloat(resultado.despesa_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular relatório mensal:", error);
        return res.status(500).json({ error: "Erro interno ao gerar relatório mensal." });
    }
});

// Rota para Relatório Diário
// server.js (Rota para Relatório Diário - Cerca da Linha 515)
// server.js (Rota para Relatório Diário)
app.get('/relatorio/diario/:data', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { data: dateString } = req.params; // data virá como 'YYYY-MM-DD'

    // Filtro por intervalo: dataString 00:00:00 (início do dia)
    const startOfDay = `${dateString} 00:00:00`;
    
    // Função auxiliar para obter a meia-noite do dia seguinte
    const getEndOfDay = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00'); // Garante que a data base é limpa
        date.setDate(date.getDate() + 1);
        return date.toISOString().slice(0, 19).replace('T', ' '); 
    };
    const endOfDay = getEndOfDay(dateString); 
    
    try {
        const sql = `SELECT SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita_total, SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND data_hora >= ? AND data_hora < ?`;
        
        // Passamos startOfDay E endOfDay para definir o intervalo exato
        const [rows] = await db.query(sql, [barbeiro_id, startOfDay, endOfDay]); 
        const resultado = rows[0];

        return res.json({
            receita_total: parseFloat(resultado.receita_total || 0).toFixed(2),
            despesa_total: parseFloat(resultado.despesa_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular relatório diário:", error);
        return res.status(500).json({ error: "Erro interno ao gerar relatório diário." });
    }
});


// Rota para Relatório Anual
// server.js (Rota para Relatório Anual)
app.get('/relatorio/anual/:ano', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { ano } = req.params;

    const startOfYear = `${ano}-01-01 00:00:00`;
    const endOfNextYear = `${parseInt(ano) + 1}-01-01 00:00:00`;

    try {
        const sql = `SELECT SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita_total, SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND data_hora >= ? AND data_hora < ?`;
        const [rows] = await db.query(sql, [barbeiro_id, startOfYear, endOfNextYear]);
        const resultado = rows[0];

        return res.json({
            receita_total: parseFloat(resultado.receita_total || 0).toFixed(2),
            despesa_total: parseFloat(resultado.despesa_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular relatório anual:", error);
        return res.status(500).json({ error: "Erro interno ao gerar relatório anual." });
    }
});



// Rota para EXCLUSÃO DA CONTA (Deleta o registro do barbeiro logado)
app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const userEmail = req.user.email;
    
    // ATENÇÃO: Esta operação DELETA TODOS os dados do barbeiro.
    try {
        const sql = 'DELETE FROM barbeiros WHERE id = ?';
        const [result] = await db.query(sql, [barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Conta não encontrada ou já excluída." });
        }
        
        console.log(`Conta do Barbeiro ${userEmail} (ID: ${barbeiro_id}) excluída com sucesso.`);
        
        return res.status(200).json({ message: "Conta excluída permanentemente. Redirecionando..." });

    } catch (err) {
        // Se este erro ocorrer, é porque o ON DELETE CASCADE falhou.
        console.error('Erro na exclusão de conta (Provável falha de FOREIGN KEY):', err);
        return res.status(500).json({ error: 'Erro interno. Verifique as restrições do banco.' });
    }
});

// ==========================================================
// ROTAS DE CLIENTES E AGENDAMENTO (stubs)
// ==========================================================
app.get('/clientes', authenticateToken, (req, res) => { res.status(501).json({ error: "Clientes não implementado." }); });
app.get('/barbeiros', authenticateToken, (req, res) => { res.status(501).json({ error: "Barbeiros não implementado." }); });
app.post('/clientes', authenticateToken, (req, res) => { res.status(501).json({ error: "Cadastro de Cliente não implementado." }); });
app.post('/agendamentos', authenticateToken, (req, res) => { res.status(501).json({ error: "Agendamento POST não implementado." }); });
app.get('/agendamentos', authenticateToken, (req, res) => { res.status(501).json({ error: "Agendamento GET não implementado." }); });
app.put('/agendamentos/:id', authenticateToken, (req, res) => { res.status(501).json({ error: "Agendamento PUT não implementado." }); });
app.delete('/agendamentos/:id', authenticateToken, (req, res) => { res.status(501).json({ error: "Agendamento DELETE não implementado." }); });


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});