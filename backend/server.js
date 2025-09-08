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
// Rota para adicionar uma nova movimentação financeira
app.post('/movimentacoes', (req, res) => {
    const { barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento } = req.body;

    // A validação agora inclui as novas colunas
    if (!barbeiro_id || !descricao || !valor || !tipo || !categoria || !forma_pagamento) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const sql = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento], (err, result) => {
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

// Rota para atualizar uma movimentação financeira
app.put('/movimentacoes/:id', (req, res) => {
    const { descricao, valor, tipo } = req.body;
    const { id } = req.params;

    const sql = 'UPDATE movimentacoes_financeiras SET descricao = ?, valor = ?, tipo = ? WHERE id = ?';
    db.query(sql, [descricao, valor, tipo, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar movimentação:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Movimentação não encontrada.' });
        }
        res.status(200).json({ message: 'Movimentação atualizada com sucesso!' });
    });
});

// Rota para deletar uma movimentação financeira
app.delete('/movimentacoes/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM movimentacoes_financeiras WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar movimentação:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Movimentação não encontrada.' });
        }
        res.status(200).json({ message: 'Movimentação deletada com sucesso!' });
    });
});

// Rota para obter o saldo total de um barbeiro
app.get('/saldo/:barbeiro_id', (req, res) => {
    const { barbeiro_id } = req.params;

    // A função SUM() soma os valores, e o CASE diferencia receitas e despesas
    const sql = `
        SELECT
            SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) AS saldo_total
        FROM movimentacoes_financeiras
        WHERE barbeiro_id = ?
    `;

    db.query(sql, [barbeiro_id], (err, results) => {
        if (err) {
            console.error('Erro ao calcular saldo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        
        // Se não houver movimentações, o saldo será null, então tratamos
        const saldo_total = results[0].saldo_total || 0;
        res.status(200).json({ saldo_total: saldo_total });
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
        if (err) {
            console.error('Erro ao inserir cliente:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
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
        if (err) {
            console.error('Erro ao inserir agendamento:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        res.status(201).json({ message: 'Agendamento criado com sucesso!', id: result.insertId });
    });
});

// Rota para listar todos os agendamentos
app.get('/agendamentos', (req, res) => {
    const sql = 'SELECT * FROM agendamentos';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        res.status(200).json(results);
    });
});


// Rota para atualizar um agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { cliente_id, barbeiro_id, data_hora, servico } = req.body;
    const { id } = req.params;

    const sql = 'UPDATE agendamentos SET cliente_id = ?, barbeiro_id = ?, data_hora = ?, servico = ? WHERE id = ?';
    db.query(sql, [cliente_id, barbeiro_id, data_hora, servico, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar agendamento:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
        res.status(200).json({ message: 'Agendamento atualizado com sucesso!' });
    });
});

// Rota para deletar um agendamento
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM agendamentos WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar agendamento:', err);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
        res.status(200).json({ message: 'Agendamento deletado com sucesso!' });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});