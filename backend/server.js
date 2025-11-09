const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

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

const SECRET_KEY = process.env.SECRET_KEY || 'BARBERIA-SECRET-KEY'; 


// Conexão com o banco de dados
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida!');
});

async function getTaxaCartao() {
    try {
        // Usa o db.promise().query() para esperar o resultado
        const [rows] = await db.promise().query('SELECT taxa FROM taxa_cartao WHERE id = 1');
        return parseFloat(rows && rows[0] ? rows[0].taxa : 0.00);
    } catch (e) {
        console.error("Erro ao buscar taxa de cartão:", e);
        return 0.00;
    }
}

// Função para formatar a data para SQL (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split('T')[0];

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
        
        const [result] = await db.promise().query(sql, [nome, email, hashedPassword, tipo_usuario]);
        
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
        const [results] = await db.promise().query(sql, [email]);
        
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
        const [updateResult] = await db.promise().query(sqlUpdate, [userId]); 

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ error: 'O usuário não está pendente ou não foi encontrado para ativação.' });
        }

        res.status(200).json({ message: 'Conta ativada com sucesso! Você pode fazer login agora.' });

    } catch (err) {
        console.error('Erro fatal na ativação de conta:', err);
        return res.status(500).json({ error: 'Erro interno ao tentar ativar a conta. Verifique o console do servidor.' });
    }
});


// ==========================================================
// ROTAS DE PERFIL E CADASTRO OBRIGATÓRIO (MIDDLEWARE INSERIDO DIRETAMENTE)
// ==========================================================

// Rota para Criar/Atualizar o Perfil do Barbeiro (POST/PUT)
// server.js - Rotas de Perfil (RECONSTRUÍDAS)

// Rota para Checar/Buscar o Perfil (GET) - Usado pelo ProfileGuard
// server.js (Rota para Checar/Buscar o Perfil - GET)

app.get('/perfil/barbeiro', authenticateToken, async (req, res) => {
    // IMPORTANTE: req.user.id é o ID do barbeiro obtido do token JWT
    const barbeiro_id = req.user.id; 
    
    try {
        // Busca o perfil que tem o barbeiro_id igual ao ID logado
        const sql = 'SELECT * FROM perfil_barbeiro WHERE barbeiro_id = ?';
        const [results] = await db.promise().query(sql, [barbeiro_id]);

        if (results.length > 0) {
            // Retorna o primeiro registro encontrado
            return res.json({ profileExists: true, data: results[0] });
        } else {
            return res.json({ profileExists: false });
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
        const sql = `
            INSERT INTO perfil_barbeiro (barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade) 
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
                localidade = VALUES(localidade)
        `;
        
        const finalComplemento = complemento === '' ? null : complemento; 

        await db.promise().query(sql, [
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
            const taxaPercentual = await getTaxaCartao();
            if (taxaPercentual > 0) {
                const taxaValor = valor * (taxaPercentual / 100);
                valorFinal = valor - taxaValor;
                
                // Registra a DESPESA (Taxa) separadamente
                const sqlInsertTaxa = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
                await db.promise().query(sqlInsertTaxa, [
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
        const [result] = await db.promise().query(sqlInsertPrincipal, [
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
    const today = getTodayDate();

    try {
        const sql = 'SELECT * FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND DATE(data_hora) = ? ORDER BY data_hora DESC';
        const [movimentacoes] = await db.promise().query(sql, [barbeiro_id, today]);

        return res.json(movimentacoes);
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
        const [movimentacao] = await db.promise().query(sql, [id, barbeiro_id]);

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
    
    // NOTA: Para simplificar o TCC, a edição não recalcula a taxa de cartão automaticamente.
    // Ela apenas atualiza os valores que o usuário enviou do frontend.

    try {
        const sql = `
            UPDATE movimentacoes_financeiras SET
            descricao = ?, valor = ?, tipo = ?, categoria = ?, forma_pagamento = ?
            WHERE id = ? AND barbeiro_id = ?
        `;
        const [result] = await db.promise().query(sql, [
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
        const [result] = await db.promise().query(sql, [id, barbeiro_id]);

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
    const today = getTodayDate();

    try {
        const sql = `
            SELECT
                SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) - SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as saldo_total
            FROM movimentacoes_financeiras
            WHERE barbeiro_id = ? AND DATE(data_hora) = ?
        `;
        const [saldo] = await db.promise().query(sql, [barbeiro_id, today]);
        const resultado = saldo[0];

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
    const today = getTodayDate();

    try {
        const sql = `
            SELECT
                SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as receita_total,
                SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as despesa_total
            FROM movimentacoes_financeiras
            WHERE barbeiro_id = ? AND DATE(data_hora) = ?
        `;
        const [totais] = await db.promise().query(sql, [barbeiro_id, today]);
        const resultado = totais[0];

        return res.json({
            receita_total: parseFloat(resultado.receita_total || 0).toFixed(2),
            despesa_total: parseFloat(resultado.despesa_total || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao calcular totais diários:", error);
        return res.status(500).json({ error: "Erro interno." });
    }
});
app.get('/relatorio/mensal/:ano/:mes', authenticateToken, (req, res) => { /* ... */ });
app.get('/relatorio/diario/:data', authenticateToken, (req, res) => { /* ... */ });
app.get('/relatorio/anual/:ano', authenticateToken, (req, res) => { /* ... */ });


// ==========================================================
// ROTAS DE CLIENTES E AGENDAMENTO
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