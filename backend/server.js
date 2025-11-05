const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// A chave secreta deve ser salva no seu .env em um projeto real!
const SECRET_KEY = process.env.SECRET_KEY || 'sua_chave_super_secreta_para_o_tcc'; 


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

// ==========================================================
// MIDDLEWARE DE AUTENTICAÇÃO
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
// ROTAS DE AUTENTICAÇÃO (LOGIN/REGISTER)
// ==========================================================

// Rota para Cadastro de Novo Barbeiro/Usuário
// Rota para Cadastro de Novo Usuário (Barbeiro ou Cliente)
app.post('/auth/register', async (req, res) => {
    // Agora esperamos também o tipo_usuario
    const { nome, email, password, tipo_usuario } = req.body; 
    
    // Validar o tipo
    if (!nome || !email || !password || !tipo_usuario || (tipo_usuario !== 'barbeiro' && tipo_usuario !== 'cliente')) {
        return res.status(400).json({ error: 'Todos os campos, incluindo o tipo de usuário (barbeiro ou cliente), são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // O SQL agora insere o tipo_usuario
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

// Rota para Login de Usuário
// Rota para Login de Usuário (APENAS ESTA ROTA DEVE SER SUBSTITUÍDA NO server.js)
// Rota para Login de Usuário (CORREÇÃO FINAL DE ESTABILIDADE)
// Rota para Login de Usuário (CORREÇÃO FINAL DE ESTABILIDADE)
// Rota para Login de Usuário (CORRIGIDA para buscar e retornar o Tipo de Usuário)
// Rota para Login de Usuário (FINALMENTE PROTEGIDA POR STATUS DE ATIVAÇÃO)
// Rota para Login de Usuário (CORRIGIDA E SEGURA POR STATUS)
// Rota para Login de Usuário (CORRIGIDA E SEGURA POR STATUS)
// Rota para Login de Usuário (CORRIGIDA E SEGURA POR STATUS)
// server.js - Rota para Login de Usuário (CORREÇÃO FINAL PARA REDIRECIONAMENTO)
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const sql = 'SELECT id, nome, email, password_hash, tipo_usuario, status_ativacao FROM barbeiros WHERE email = ?';
        const [results] = await db.promise().query(sql, [email]);
        
        const user = results[0];

        if (!user || !user.password_hash) { 
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        // 1. CHECAGEM CRÍTICA: BLOQUEIA O ACESSO DE CONTAS PENDENTES
        if (user.status_ativacao === 'pendente' || user.status_ativacao === null) {
            // RETORNA 403 e o userId para que o Frontend possa redirecionar corretamente
            return res.status(403).json({ 
                error: 'Ativação pendente. Por favor, insira sua chave de licença.',
                userId: user.id // <--- CRÍTICO: Retornamos o ID
            });
        }
        
        // 2. Compara a Senha
        const SECRET_KEY = process.env.SECRET_KEY || 'sua_chave_super_secreta_para_o_tcc';
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


// server.js - Adicionar esta rota (após /auth/login)

// Rota para Ativação de Conta (Verifica a chave mestra e atualiza o status do barbeiro)
// server.js - ROTA DE ATIVAÇÃO CORRIGIDA
// server.js - ROTA DE ATIVAÇÃO CORRIGIDA (GARANTINDO ASYNC/AWAIT)
// server.js - ROTA DE ATIVAÇÃO CORRIGIDA (AGORA ACEITA userId como STRING)
// server.js - ROTA DE ATIVAÇÃO FINAL E CORRIGIDA
app.post('/auth/ativar-conta', async (req, res) => {
    // userId é passado como string do frontend
    const { userId, chaveAcesso } = req.body; 
    
    // 1. Validação de segurança dos dados recebidos
    if (!userId || !chaveAcesso) {
        return res.status(400).json({ error: 'ID do usuário e Chave de Acesso são obrigatórios.' });
    }
    
    // A chave mestra deve ser a mesma usada no seu banco ou arquivo .env
    const CHAVE_MESTRA_CORRETA = "BAR-BER-APLI-MASTER-ADIMIN25"; // USE A SUA CHAVE REAL AQUI!

    try {
        // 2. Verifica se a chave fornecida corresponde à chave mestra
        if (chaveAcesso !== CHAVE_MESTRA_CORRETA) {
            return res.status(401).json({ error: 'Chave de acesso inválida. Por favor, verifique.' });
        }

        // 3. Atualiza o status do Barbeiro para 'ativa'
        // A SQL usa o `id` como parâmetro, que aceita a string do `userId`
        const sqlUpdate = "UPDATE barbeiros SET status_ativacao = 'ativa' WHERE id = ? AND status_ativacao = 'pendente' AND tipo_usuario = 'barbeiro'";
        const [updateResult] = await db.promise().query(sqlUpdate, [userId]); 

        if (updateResult.affectedRows === 0) {
            // Se nenhum usuário foi afetado, ou ele já estava ativo, ou não era barbeiro
            return res.status(400).json({ error: 'O usuário não está pendente ou não foi encontrado para ativação.' });
        }

        // 4. Sucesso na Ativação
        res.status(200).json({ message: 'Conta ativada com sucesso! Você pode fazer login agora.' });

    } catch (err) {
        // Se houver um erro de conexão com o banco ou sintaxe SQL
        console.error('Erro fatal na ativação de conta:', err);
        return res.status(500).json({ error: 'Erro interno ao tentar ativar a conta. Verifique o console do servidor.' });
    }
});


// server.js - Adicionar estas rotas

// Rota para Criar/Atualizar o Perfil do Barbeiro
// É um POST para criação e pode ser usado como PUT para atualização, mas vamos usar POST simples
app.post('/perfil/barbeiro', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf } = req.body;
    
    // Validação básica de campos obrigatórios (adapte se você tiver campos opcionais)
    if (!nome_barbeiro || !nome_barbearia || !documento || !telefone || !rua || !numero || !bairro || !cep || !uf) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        // Tenta inserir: se já existir, ele falha, e isso é um sinal de que o perfil já existe.
        const sql = 'INSERT INTO perfil_barbeiro (barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        const [result] = await db.promise().query(sql, [barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf]);

        res.status(201).json({ message: 'Perfil profissional criado com sucesso!' });

    } catch (err) {
        // Se a inserção falhou (ER_DUP_ENTRY) ou por outro erro, tratamos
        if (err.code === 'ER_DUP_ENTRY') {
             // Caso o perfil já exista (barbeiro_id é PK)
             return res.status(409).json({ error: 'Este barbeiro já possui um perfil cadastrado.' });
        }
        console.error('Erro ao criar perfil:', err);
        res.status(500).json({ error: 'Erro interno ao salvar perfil.' });
    }
});

// Rota para Checar se o Perfil Existe (GET)
app.get('/perfil/barbeiro', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    
    try {
        const sql = 'SELECT * FROM perfil_barbeiro WHERE barbeiro_id = ?';
        const [results] = await db.promise().query(sql, [barbeiro_id]);

        if (results.length > 0) {
            // Perfil existe
            return res.json({ profileExists: true, data: results[0] });
        } else {
            // Perfil não existe (deve ser redirecionado para o formulário)
            return res.json({ profileExists: false });
        }

    } catch (err) {
        console.error('Erro ao checar perfil:', err);
        res.status(500).json({ error: 'Erro interno ao checar perfil.' });
    }
});


// ==========================================================
// ROTAS DE CONFIGURAÇÃO (TAXA DO CARTÃO)
// ==========================================================
app.use('/taxa-cartao', authenticateToken); 

// Rota para buscar a taxa atual
app.get('/taxa-cartao', (req, res) => {
    const sql = 'SELECT taxa FROM taxa_cartao WHERE id = 1';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno ao buscar taxa.' });
        const taxa = results.length > 0 ? parseFloat(results[0].taxa) : 0.00;
        res.status(200).json({ taxa: taxa });
    });
});

// Rota para atualizar a taxa
app.put('/taxa-cartao', (req, res) => {
    const { taxa } = req.body;
    
    if (typeof taxa === 'undefined' || parseFloat(taxa) < 0) {
        return res.status(400).json({ error: "Taxa inválida. Use um número positivo." });
    }

    const sql = 'INSERT INTO taxa_cartao (id, taxa) VALUES (1, ?) ON DUPLICATE KEY UPDATE taxa = ?';
    const taxaNumerica = parseFloat(taxa);
    
    db.query(sql, [taxaNumerica, taxaNumerica], (err) => {
        if (err) return res.status(500).json({ error: 'Erro interno ao atualizar taxa.' });
        res.status(200).json({ message: 'Taxa de cartão atualizada com sucesso!' });
    });
});


// ==========================================================
// ROTAS DE MOVIMENTAÇÕES FINANCEIRAS (CONTROLE DE CAIXA) - Protegidas
// ==========================================================
app.use('/movimentacoes', authenticateToken); 

// Rota para adicionar uma nova movimentação financeira (COMPLETA E CORRIGIDA COM LÓGICA DE TAXA)
app.post('/movimentacoes', async (req, res) => {
    const barbeiro_id = req.user.id; // USA O ID DO USUÁRIO LOGADO
    const { descricao, valor, tipo, categoria, forma_pagamento } = req.body;

    if (!barbeiro_id || !descricao || !valor || !tipo || !categoria || !forma_pagamento) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    let taxaCartao = 0;
    let valorTaxa = 0;

    try {
        // 1. BUSCA A TAXA, SE FOR PAGAMENTO NO CARTÃO
        if (forma_pagamento === 'cartao' && tipo === 'receita') {
            const sqlTaxa = 'SELECT taxa FROM taxa_cartao WHERE id = 1';
            
            const [results] = await db.promise().query(sqlTaxa); 
            
            if (results.length > 0) {
                taxaCartao = parseFloat(results[0].taxa) || 0;
                if (taxaCartao > 0) {
                    valorTaxa = (parseFloat(valor) * (taxaCartao / 100)).toFixed(2);
                }
            }
        }
        
        // --- 2. INSERÇÃO DA MOVIMENTAÇÃO PRINCIPAL ---
        const sqlPrincipal = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
        
        const [resultPrincipal] = await db.promise().query(sqlPrincipal, [barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento]);

        // 3. SE HOUVER TAXA, INSERE A DESPESA AUTOMATICAMENTE
        if (valorTaxa > 0) {
            const descricaoTaxa = `Despesa Taxa Maquininha (${taxaCartao}%) Ref: ${descricao}`;
            const sqlDespesa = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
            
            await db.promise().query(sqlDespesa, [barbeiro_id, descricaoTaxa, valorTaxa, 'despesa', 'taxa', 'cartao']);
        }

        res.status(201).json({ message: 'Movimentação registrada com sucesso!', id: resultPrincipal.insertId });

    } catch (err) {
        console.error('Erro ao inserir movimentação:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// Rota para listar as movimentações financeiras do USUÁRIO LOGADO (HISTÓRICO COMPLETO)
app.get('/movimentacoes', (req, res) => {
    const barbeiro_id = req.user.id; 
    const sql = 'SELECT * FROM movimentacoes_financeiras WHERE barbeiro_id = ? ORDER BY data_hora DESC'; 
    db.query(sql, [barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        res.status(200).json(results);
    });
});

// Rota para buscar uma única movimentação por ID (GET BY ID)
app.get('/movimentacoes/:id', (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id; 

    const sql = 'SELECT * FROM movimentacoes_financeiras WHERE id = ? AND barbeiro_id = ?';
    db.query(sql, [id, barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        if (results.length > 0) {
            return res.status(200).json(results[0]);
        }
        
        res.status(404).json({ message: 'Movimentação não encontrada ou você não tem acesso a ela.' });
    });
});


// Rota para atualizar uma movimentação financeira (PUT)
app.put('/movimentacoes/:id', (req, res) => {
    const { descricao, valor, tipo, categoria, forma_pagamento } = req.body;
    const { id } = req.params;
    const barbeiro_id = req.user.id; 

    const sql = 'UPDATE movimentacoes_financeiras SET descricao = ?, valor = ?, tipo = ?, categoria = ?, forma_pagamento = ? WHERE id = ? AND barbeiro_id = ?';
    db.query(sql, [descricao, valor, tipo, categoria, forma_pagamento, id, barbeiro_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Movimentação não encontrada ou você não tem permissão para editar.' });
        res.status(200).json({ message: 'Movimentação atualizada com sucesso!' });
    });
});

// Rota para deletar uma movimentação financeira (DELETE)
app.delete('/movimentacoes/:id', (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id; 

    const sql = 'DELETE FROM movimentacoes_financeiras WHERE id = ? AND barbeiro_id = ?';
    db.query(sql, [id, barbeiro_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Movimentação não encontrada ou você não tem permissão para deletar.' });
        res.status(200).json({ message: 'Movimentação deletada com sucesso!' });
    });
});

// Rota para obter o saldo total, filtrando apenas pelo DIA ATUAL (CAIXA DIÁRIO)
// CORREÇÃO: Removemos /:barbeiro_id da URL
app.get('/saldo', authenticateToken, (req, res) => {
    const barbeiro_id = req.user.id; 

    const sql = "SELECT IFNULL(SUM(CAST(valor AS DECIMAL(10, 2)) * CASE WHEN tipo = 'receita' THEN 1 ELSE -1 END), 0) AS saldo_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND DATE(data_hora) = CURDATE()";

    db.query(sql, [barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        const saldo_total = results[0].saldo_total || 0;
        res.status(200).json({ saldo_total: saldo_total });
    });
});

// Rota para obter RECEITAS e DESPESAS TOTAIS do DIA ATUAL
// CORREÇÃO: Removemos /:barbeiro_id da URL
app.get('/totais/diarios', authenticateToken, (req, res) => {
    const barbeiro_id = req.user.id; 

    const sql = "SELECT IFNULL(SUM(CASE WHEN tipo = 'receita' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS receita_total, IFNULL(SUM(CASE WHEN tipo = 'despesa' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS despesa_total FROM movimentacoes_financeiras WHERE barbeiro_id = ? AND DATE(data_hora) = CURDATE()";

    db.query(sql, [barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        const resultado = results[0] || { receita_total: 0, despesa_total: 0 };
        
        resultado.receita_total = parseFloat(resultado.receita_total) || 0;
        resultado.despesa_total = parseFloat(resultado.despesa_total) || 0;

        res.status(200).json(resultado);
    });
});


// Rota para Relatório Mensal (Receita Total e Despesa Total para um mês/ano)
app.get('/relatorio/mensal/:ano/:mes', authenticateToken, (req, res) => {
    const { ano, mes } = req.params;
    const barbeiro_id = req.user.id; 

    const sql = "SELECT IFNULL(SUM(CASE WHEN tipo = 'receita' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS receita_total, IFNULL(SUM(CASE WHEN tipo = 'despesa' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS despesa_total FROM movimentacoes_financeiras WHERE YEAR(data_hora) = ? AND MONTH(data_hora) = ? AND barbeiro_id = ?";

    db.query(sql, [ano, mes, barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        const resultado = results[0] || { receita_total: 0, despesa_total: 0 };
        
        res.status(200).json(resultado);
    });
});


// --- ROTA DE RELATÓRIO DIÁRIO (DAY-OVER-DAY) ---
app.get('/relatorio/diario/:data', authenticateToken, (req, res) => {
    const { data } = req.params; 
    const barbeiro_id = req.user.id; 

    const sql = "SELECT IFNULL(SUM(CASE WHEN tipo = 'receita' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS receita_total, IFNULL(SUM(CASE WHEN tipo = 'despesa' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS despesa_total FROM movimentacoes_financeiras WHERE DATE(data_hora) = ? AND barbeiro_id = ?";

    db.query(sql, [data, barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        const resultado = results[0] || { receita_total: 0, despesa_total: 0 };
        res.status(200).json(resultado);
    });
});


// --- ROTA DE RELATÓRIO ANUAL (YEAR-OVER-YEAR) ---
app.get('/relatorio/anual/:ano', authenticateToken, (req, res) => {
    const { ano } = req.params; 
    const barbeiro_id = req.user.id; 

    const sql = "SELECT IFNULL(SUM(CASE WHEN tipo = 'receita' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS receita_total, IFNULL(SUM(CASE WHEN tipo = 'despesa' THEN CAST(valor AS DECIMAL(10, 2)) ELSE 0 END), 0) AS despesa_total FROM movimentacoes_financeiras WHERE YEAR(data_hora) = ? AND barbeiro_id = ?";

    db.query(sql, [ano, barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        
        const resultado = results[0] || { receita_total: 0, despesa_total: 0 };
        res.status(200).json(resultado);
    });
});

// ==========================================================
// ROTAS DE CLIENTES E AGENDAMENTO - Protegidas
// ==========================================================
app.use('/clientes', authenticateToken);
app.use('/barbeiros', authenticateToken);
app.use('/agendamentos', authenticateToken);


// Rota para listar todos os clientes (para preencher o select)
app.get('/clientes', (req, res) => {
    const sql = 'SELECT id, nome FROM clientes'; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        res.status(200).json(results);
    });
});

// Rota para listar todos os barbeiros (necessário para agendamento)
app.get('/barbeiros', (req, res) => {
    const sql = 'SELECT id, nome FROM barbeiros'; 
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        res.status(200).json(results);
    });
});


// Rota para adicionar um novo cliente
app.post('/clientes', (req, res) => {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email do cliente são obrigatórios.' });
    }

    const sql = 'INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)';
    db.query(sql, [nome, email, telefone], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        res.status(201).json({ message: 'Cliente adicionado com sucesso!', id: result.insertId });
    });
});

// Rota para adicionar um novo agendamento
app.post('/agendamentos', (req, res) => {
    const { cliente_id, barbeiro_id, data_hora, servico } = req.body;

    if (!cliente_id || !barbeiro_id || !data_hora || !servico) {
        return res.status(400).json({ error: 'Todos os campos do agendamento são obrigatórios.' });
    }

    const sql = 'INSERT INTO agendamentos (cliente_id, barbeiro_id, data_hora, servico) VALUES (?, ?, ?, ?)';
    db.query(sql, [cliente_id, barbeiro_id, data_hora, servico], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        res.status(201).json({ message: 'Agendamento criado com sucesso!', id: result.insertId });
    });
});

// Rota para listar todos os agendamentos (GET)
app.get('/agendamentos', (req, res) => {
    const barbeiro_id = req.user.id; // FILTRA AGENDAMENTOS POR BARBEIRO LOGADO

    const sql = "SELECT a.id, a.data_hora, a.servico, c.nome AS nome_cliente, b.nome AS nome_barbeiro FROM agendamentos a JOIN clientes c ON a.cliente_id = c.id JOIN barbeiros b ON a.barbeiro_id = b.id WHERE a.barbeiro_id = ? ORDER BY a.data_hora ASC";

    db.query(sql, [barbeiro_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar agendamentos no banco de dados.' });
        res.json(results);
    });
});


// Rota para atualizar um agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { cliente_id, barbeiro_id, data_hora, servico } = req.body;
    const { id } = req.params;
    const logged_in_barbeiro_id = req.user.id; 
    
    const sql = 'UPDATE agendamentos SET cliente_id = ?, barbeiro_id = ?, data_hora = ?, servico = ? WHERE id = ? AND barbeiro_id = ?';
    db.query(sql, [cliente_id, barbeiro_id, data_hora, servico, id, logged_in_barbeiro_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Agendamento não encontrado ou sem permissão.' });
        res.status(200).json({ message: 'Agendamento atualizado com sucesso!' });
    });
});

// Rota para deletar um agendamento
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id; 

    const sql = 'DELETE FROM agendamentos WHERE id = ? AND barbeiro_id = ?';
    db.query(sql, [id, barbeiro_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro interno do servidor.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Agendamento não encontrado ou sem permissão.' });
        res.status(200).json({ message: 'Agendamento deletado com sucesso!' });
    });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});