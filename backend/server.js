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
app.get('/perfil/barbeiro', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    
    try {
        const sql = 'SELECT * FROM perfil_barbeiro WHERE barbeiro_id = ?';
        const [results] = await db.promise().query(sql, [barbeiro_id]);

        if (results.length > 0) {
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
        // SQL que faz INSERT OU UPDATE (ON DUPLICATE KEY UPDATE)
        const sql = `
            INSERT INTO perfil_barbeiro (barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
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
        console.error('Erro ao salvar perfil:', err);
        res.status(500).json({ error: 'Erro interno ao salvar perfil.' });
    }
});

// ==========================================================
// ROTAS DE MOVIMENTAÇÕES FINANCEIRAS (CONTROLE DE CAIXA)
// ==========================================================
// Aplicando o middleware nas rotas que precisam de autenticação
app.get('/movimentacoes', authenticateToken, (req, res) => { /* ... */ });
app.post('/movimentacoes', authenticateToken, async (req, res) => { /* ... */ });
app.get('/movimentacoes/:id', authenticateToken, (req, res) => { /* ... */ });
app.put('/movimentacoes/:id', authenticateToken, (req, res) => { /* ... */ });
app.delete('/movimentacoes/:id', authenticateToken, (req, res) => { /* ... */ });
app.get('/saldo', authenticateToken, (req, res) => { /* ... */ });
app.get('/totais/diarios', authenticateToken, (req, res) => { /* ... */ });
app.get('/relatorio/mensal/:ano/:mes', authenticateToken, (req, res) => { /* ... */ });
app.get('/relatorio/diario/:data', authenticateToken, (req, res) => { /* ... */ });
app.get('/relatorio/anual/:ano', authenticateToken, (req, res) => { /* ... */ });


// ==========================================================
// ROTAS DE CLIENTES E AGENDAMENTO
// ==========================================================
app.get('/clientes', authenticateToken, (req, res) => { /* ... */ });
app.get('/barbeiros', authenticateToken, (req, res) => { /* ... */ });
app.post('/clientes', authenticateToken, (req, res) => { /* ... */ });
app.post('/agendamentos', authenticateToken, (req, res) => { /* ... */ });
app.get('/agendamentos', authenticateToken, (req, res) => { /* ... */ });
app.put('/agendamentos/:id', authenticateToken, (req, res) => { /* ... */ });
app.delete('/agendamentos/:id', authenticateToken, (req, res) => { /* ... */ });


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});