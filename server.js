const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());

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

// Rota para adicionar uma nova movimentação financeira (já existente)
app.post('/movimentacoes', (req, res) => {
    const { barbeiro_id, descricao, valor, tipo } = req.body;

    if (!barbeiro_id || !descricao || !valor || !tipo) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo) VALUES (?, ?, ?, ?)';
    db.query(sql, [barbeiro_id, descricao, valor, tipo], (err, result) => {
        if (err) {
            console.error('Erro ao inserir movimentação:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        res.status(201).json({ message: 'Movimentação adicionada com sucesso!', id: result.insertId });
    });
});

// AQUI VOCÊ ADICIONA A NOVA ROTA GET
// Rota para listar todas as movimentações financeiras
app.get('/movimentacoes', (req, res) => {
    const sql = 'SELECT * FROM movimentacoes_financeiras';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar movimentações:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        res.status(200).json(results);
    });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});