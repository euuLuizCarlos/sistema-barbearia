const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
// 🚨 MÓDULOS DE UPLOAD 🚨
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// -----------------------

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
// 🚨 CONFIGURAÇÃO DO MULTER (UPLOAD DE FOTOS) 🚨
// Este bloco deve estar aqui, após a inicialização do 'app'.
// -------------------------------------------------------------

const SECRET_KEY = process.env.SECRET_KEY || 'BARBERIA-SECRET-KEY'; 

// Password reset token settings
const PASSWORD_RESET_TOKEN_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_MINUTES || 60);

function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendResetEmail(email, resetLink) {
    // Em dev: se não houver configuração de SMTP, apenas loga o link
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log(`Reset link for ${email}: ${resetLink}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const html = `
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha. Clique no link abaixo (válido por ${PASSWORD_RESET_TOKEN_MINUTES} minutos):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Se você não solicitou, ignore este email.</p>
    `;

    await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@seusite.com',
        to: email,
        subject: 'Redefinição de senha',
        html
    });
}

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

// ======= Validação de CPF e CNPJ (algoritmos oficiais) =======
const isValidCPF = (cpf) => {
    if (!cpf) return false;
    const str = String(cpf).replace(/\D/g, '');
    if (str.length !== 11) return false;
    if (/^(\d)\1+$/.test(str)) return false; // todos iguais

    const calc = (t) => {
        let sum = 0;
        for (let i = 0; i < t; i++) {
            sum += parseInt(str.charAt(i)) * ((t + 1) - i);
        }
        const rev = 11 - (sum % 11);
        return rev > 9 ? 0 : rev;
    };

    const digit1 = calc(9);
    const digit2 = calc(10);

    return digit1 === parseInt(str.charAt(9)) && digit2 === parseInt(str.charAt(10));
};

const isValidCNPJ = (cnpj) => {
    if (!cnpj) return false;
    const str = String(cnpj).replace(/\D/g, '');
    if (str.length !== 14) return false;
    if (/^(\d)\1+$/.test(str)) return false;

    const calc = (t) => {
        let size = t;
        let numbers = str.substring(0, size);
        let sum = 0;
        let pos = size - 7;

        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }

        const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result;
    };

    const digit1 = calc(12);
    const digit2 = (() => {
        const temp = str.substring(0, 12) + digit1;
        let sum = 0;
        let pos = 2;
        for (let i = temp.length - 1; i >= 0; i--) {
            sum += parseInt(temp.charAt(i)) * pos;
            pos = pos === 9 ? 2 : pos + 1;
        }
        return sum % 11 < 2 ? 0 : 11 - (sum % 11);
    })();

    return digit1 === parseInt(str.charAt(12)) && digit2 === parseInt(str.charAt(13));
};

const isValidDocumento = (doc) => {
    if (!doc) return false;
    const cleaned = String(doc).replace(/\D/g, '');
    if (cleaned.length === 11) return isValidCPF(cleaned);
    if (cleaned.length === 14) return isValidCNPJ(cleaned);
    return false;
};

// Validação simples de email
const isValidEmail = (email) => {
    if (!email) return false;
    // Regex simples e robusta para validar formato básico de email
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// Verifica se é email Gmail
const isGmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@gmail\.com$/i.test(String(email).toLowerCase());
};

// Função para formatar a data para SQL (YYYY-MM-DD) usando hora local
const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Retorna a meia-noite do dia atual no horário local no formato MySQL 'YYYY-MM-DD HH:MM:SS'
const getStartOfDay = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
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
// Rota para Cadastro (aceita multipart/form-data para permitir upload de foto durante o registro)
app.post('/auth/register', (req, res) => {
    // Usa o middleware de upload para permitir campo 'foto_perfil' opcional
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Erro Multer no registro:', err);
            return res.status(500).json({ error: 'Erro no upload do arquivo.' });
        } else if (err) {
            console.error('Erro desconhecido no upload:', err);
            return res.status(500).json({ error: 'Erro no processamento do cadastro.' });
        }

        try {
            // Extrai campos do body (quando multipart, o body estará em req.body)
            const { nome, email, password, tipo_usuario, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade } = req.body;

            // Validação por campo -> será retornado { errors: { field: message } }
            const fieldErrors = {};
            if (!nome || String(nome).trim() === '') fieldErrors.nome = 'Nome é obrigatório.';
            if (!email || String(email).trim() === '') fieldErrors.email = 'Email é obrigatório.';
            else if (!isValidEmail(email)) fieldErrors.email = 'Email inválido.';
            else if (!isGmail(email)) fieldErrors.email = 'Somente endereços @gmail.com são aceitos.';
            if (!password || String(password).length < 8) fieldErrors.password = 'Senha muito curta. Use ao menos 8 caracteres.';
            if (!tipo_usuario || (tipo_usuario !== 'barbeiro' && tipo_usuario !== 'cliente')) fieldErrors.tipo_usuario = 'Tipo de usuário inválido.';

            if (Object.keys(fieldErrors).length > 0) {
                return res.status(400).json({ errors: fieldErrors });
            }

            // Verifica se o email já existe em barbeiros OU clientes
            try {
                const [emailRows] = await db.query(
                    `SELECT 'barbeiro' as origem, id FROM barbeiros WHERE email = ? UNION SELECT 'cliente' as origem, id FROM clientes WHERE email = ?`,
                    [email, email]
                );
                if (emailRows && emailRows.length > 0) {
                    return res.status(409).json({ errors: { email: 'Email já está em uso.' } });
                }
            } catch (emailCheckErr) {
                console.error('Erro ao verificar email duplicado:', emailCheckErr);
                return res.status(500).json({ error: 'Erro ao validar email.' });
            }

            // Se for barbeiro, valida campos obrigatórios do perfil e verifica duplicidade de documento ANTES de criar o usuário
            if (tipo_usuario === 'barbeiro') {
                const cleanedDocumento = (documento || '').replace(/\D/g, '');
                const barberErrors = {};
                if (!nome_barbearia || String(nome_barbearia).trim() === '') barberErrors.nome_barbearia = 'Nome da barbearia é obrigatório.';
                if (!cleanedDocumento) barberErrors.documento = 'Documento (CPF/CNPJ) é obrigatório.';
                if (!telefone) barberErrors.telefone = 'Telefone é obrigatório.';
                if (!rua) barberErrors.rua = 'Rua é obrigatória.';
                if (!numero) barberErrors.numero = 'Número é obrigatório.';
                if (!bairro) barberErrors.bairro = 'Bairro é obrigatório.';
                if (!cep) barberErrors.cep = 'CEP é obrigatório.';
                if (!uf) barberErrors.uf = 'UF é obrigatório.';
                if (!localidade) barberErrors.localidade = 'Localidade (cidade) é obrigatória.';

                if (Object.keys(barberErrors).length > 0) {
                    return res.status(400).json({ errors: barberErrors });
                }

                // Valida algoritmo CPF/CNPJ
                if (!isValidDocumento(cleanedDocumento)) {
                    return res.status(400).json({ errors: { documento: 'Documento inválido (CPF ou CNPJ com dígitos incorretos).' } });
                }

                try {
                    const [existing] = await db.query('SELECT barbeiro_id FROM perfil_barbeiro WHERE documento = ?', [cleanedDocumento]);
                    if (existing && existing.length > 0) {
                        return res.status(409).json({ errors: { documento: 'Documento (CPF/CNPJ) já cadastrado em outro perfil.' } });
                    }
                } catch (checkErr) {
                    console.error('Erro ao verificar documento duplicado:', checkErr);
                    return res.status(500).json({ error: 'Erro ao validar documento.' });
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insere o registro base na tabela barbeiros (foto será atualizada posteriormente se houver arquivo)
            // Insere já com status_ativacao 'ativa' para simplificar fluxo (sem chave)
            const sql = 'INSERT INTO barbeiros (nome, email, password_hash, tipo_usuario, status_ativacao) VALUES (?, ?, ?, ?, ?)';
            const [result] = await db.query(sql, [nome, email, hashedPassword, tipo_usuario, 'ativa']);
            const userId = result.insertId;

            // Se veio um arquivo, renomeia para incluir o ID e atualiza a coluna foto_perfil
            if (req.file) {
                try {
                    const oldFilename = req.file.filename;
                    const filenameWithId = `foto-${userId}-${oldFilename}`;
                    const oldPath = req.file.path;
                    const newPath = path.join(uploadsDir, filenameWithId);
                    fs.renameSync(oldPath, newPath);
                    const fotoPath = `/uploads/${filenameWithId}`;
                    await db.query('UPDATE barbeiros SET foto_perfil = ? WHERE id = ?', [fotoPath, userId]);
                } catch (fileErr) {
                    console.warn('Aviso: falha ao processar a foto enviada durante o registro:', fileErr.message);
                }
            }

            // Se for barbeiro e vieram dados de perfil, salva na tabela perfil_barbeiro
            if (tipo_usuario === 'barbeiro') {
                // Requer os campos mínimos do perfil; se não vierem, salva apenas o registro base
                // grava o perfil usando o documento sem formatação
                const cleanedDocumento = (documento || '').replace(/\D/g, '');
                if (!isValidDocumento(cleanedDocumento)) {
                    // não falha todo o registro do usuário base, mas solicita correção do perfil
                    return res.status(400).json({ errors: { documento: 'Documento inválido (CPF/CNPJ com dígitos incorretos).' } });
                }
                const finalComplemento = complemento === '' ? null : complemento;
                const sqlPerfil = `INSERT INTO perfil_barbeiro (barbeiro_id, nome_barbeiro, nome_barbearia, documento, telefone, rua, numero, bairro, complemento, cep, uf, localidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                await db.query(sqlPerfil, [userId, nome, nome_barbearia, cleanedDocumento, telefone.replace(/\D/g, ''), rua, numero, bairro, finalComplemento, cep.replace(/\D/g, ''), uf, localidade]);
            }

            return res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: userId, userName: nome });

        } catch (err) {
            // Se houver erro de duplicidade, tenta mapear e retornar 409 (campo email)
            if (err && err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ errors: { email: 'Email já está em uso.' } });
            }
            console.error('Erro no registro:', err);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    });
});

// Rota dedicada para Cadastro de Cliente
app.post('/auth/register/cliente', async (req, res) => {
    const { nome, email, password, telefone, documento } = req.body; // Campos da tabela 'clientes'
    
    const fieldErrors = {};
    if (!nome || String(nome).trim() === '') fieldErrors.nome = 'Nome é obrigatório.';
    if (!email || String(email).trim() === '') fieldErrors.email = 'Email é obrigatório.';
    else if (!isValidEmail(email)) fieldErrors.email = 'Email inválido.';
    else if (!isGmail(email)) fieldErrors.email = 'Somente endereços @gmail.com são aceitos.';
    if (!password || String(password).length < 8) fieldErrors.password = 'Senha muito curta. Use ao menos 8 caracteres.';

    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ errors: fieldErrors });
    }

    // Verifica se o email já existe em barbeiros OU clientes
    try {
        const [emailRows] = await db.query(
            `SELECT 'barbeiro' as origem, id FROM barbeiros WHERE email = ? UNION SELECT 'cliente' as origem, id FROM clientes WHERE email = ?`,
            [email, email]
        );
        if (emailRows && emailRows.length > 0) {
            return res.status(409).json({ errors: { email: 'Email já está em uso.' } });
        }
    } catch (emailCheckErr) {
        console.error('Erro ao verificar email duplicado (cliente):', emailCheckErr);
        return res.status(500).json({ error: 'Erro ao validar email.' });
    }

    try {
        // Se foi enviado documento, valida (esperamos CPF para clientes)
        const cleanedDocumento = documento ? String(documento).replace(/\D/g, '') : null;
        if (cleanedDocumento && cleanedDocumento.length !== 11) {
            return res.status(400).json({ error: 'Documento inválido para cliente. Use CPF com 11 dígitos.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insere na tabela 'clientes'. Se a coluna 'documento' não existir no banco,
        // o DB retornará erro — trate como opcional no frontend caso seu esquema não tenha sido atualizado.
        const sql = cleanedDocumento
            ? 'INSERT INTO clientes (nome, email, password_hash, telefone, documento) VALUES (?, ?, ?, ?, ?)'
            : 'INSERT INTO clientes (nome, email, password_hash, telefone) VALUES (?, ?, ?, ?)';

        const params = cleanedDocumento
            ? [nome, email, hashedPassword, telefone || null, cleanedDocumento]
            : [nome, email, hashedPassword, telefone || null];

        const [result] = await db.query(sql, params);

        // Sucesso: Cliente não precisa de ativação.
        res.status(201).json({ message: 'Cliente registrado com sucesso!', userId: result.insertId });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ errors: { email: 'Email já está em uso.' } });
        }
        console.error('Erro no registro do cliente:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// Rota para Login de Usuário (CHECA O STATUS DE ATIVAÇÃO)
// Rota para Login de Usuário (CHECA Cliente OU Barbeiro)
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // --- 1. TENTA BUSCAR NA TABELA 'BARBEIROS' ---
        // Barbeiros têm status de ativação e tipo_usuario (barbeiro, admin)
        let sql = 'SELECT id, nome, email, password_hash, tipo_usuario, status_ativacao FROM barbeiros WHERE email = ?';
        let [results] = await db.query(sql, [email]);
        let user = results[0];
        let userType = user?.tipo_usuario;
        let isBarbeiro = true; // Flag para rastrear a origem do usuário
        
        // --- 2. SE NÃO ENCONTROU, TENTA BUSCAR NA TABELA 'CLIENTES' ---
        if (!user) {
            // Clientes NÃO têm status_ativacao ou tipo_usuario no DB, definimos fixo aqui
            sql = 'SELECT id, nome, email, password_hash FROM clientes WHERE email = ?';
            [results] = await db.query(sql, [email]);
            user = results[0];
            userType = 'cliente'; // Define o tipo manualmente
            isBarbeiro = false; // Não é Barbeiro
        }

        // --- 3. VALIDAÇÃO DE EXISTÊNCIA E SENHA ---
        if (!user || !user.password_hash) { 
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }
        
        // --- 4. LÓGICA DE ATIVAÇÃO (APENAS PARA BARBEIROS) ---
        // Se for Barbeiro e o status for 'pendente', bloqueia o login
        if (isBarbeiro && user.status_ativacao === 'pendente') {
            return res.status(403).json({ 
                error: 'Ativação pendente. Por favor, insira sua chave de licença.',
                userId: user.id 
            });
        }
        
        // Se for Cliente, este bloco é ignorado, e o login segue normalmente.

        // --- 5. SUCESSO: GERA O TOKEN ---
        const token = jwt.sign({ id: user.id, email: user.email, tipo: userType }, SECRET_KEY, { expiresIn: '1h' });
        
        res.json({ 
            message: 'Login bem-sucedido!', 
            token, 
            userId: user.id, 
            userName: user.nome,
            userType: userType // Retorna 'cliente', 'barbeiro' ou 'admin'
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


// Rota para EXCLUSÃO DA CONTA (Suporta Barbeiro e Cliente)
app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userType = req.user.tipo;

    try {
        let sql;
        let params = [userId];

        if (userType === 'barbeiro' || userType === 'admin') {
            sql = 'DELETE FROM barbeiros WHERE id = ?';
        } else if (userType === 'cliente') {
            sql = 'DELETE FROM clientes WHERE id = ?';
        } else {
            return res.status(400).json({ error: 'Tipo de usuário inválido para exclusão.' });
        }

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Conta não encontrada ou já excluída.' });
        }

        console.log(`Conta do usuário ${userEmail} (ID: ${userId}, tipo: ${userType}) excluída com sucesso.`);
        return res.status(200).json({ message: 'Conta excluída permanentemente. Redirecionando...' });

    } catch (err) {
        console.error('Erro na exclusão de conta:', err);
        return res.status(500).json({ error: 'Erro interno. Verifique as restrições do banco.' });
    }
});


// ==========================================================
// ROTAS DE PERFIL E CADASTRO OBRIGATÓRIO (COM MULTER INTEGRADO)
// ==========================================================

// Rota para Checar/Buscar o Perfil (GET) - Inclui o campo foto_perfil
// Rota para Checar/Buscar o Perfil (GET) - Requer autenticação
app.get('/perfil/barbeiro', authenticateToken, async (req, res) => {
    // Requer o ID do usuário LOGADO
    const barbeiro_id = req.user.id; 
    
    try {
        // Seleciona o perfil completo e junta com a foto/email da tabela base
        const sql = `
            SELECT pb.*, b.nome AS nome_barbeiro_auth, b.email, b.foto_perfil 
            FROM perfil_barbeiro pb
            JOIN barbeiros b ON pb.barbeiro_id = b.id
            WHERE pb.barbeiro_id = ?
        `;
        const [results] = await db.query(sql, [barbeiro_id]);

        if (results.length > 0) {
            // Perfil COMPLETO existe: Modo EDIÇÃO
            return res.json({ profileExists: true, data: results[0] });
        } else {
            // Perfil COMPLETO não existe: Busca dados básicos para Cadastro Inicial
            const [basicInfo] = await db.query('SELECT nome, email, foto_perfil FROM barbeiros WHERE id = ?', [barbeiro_id]);
            
            // É CRUCIAL retornar o nome do barbeiro, mesmo que o perfil completo não exista
            return res.json({ profileExists: false, data: basicInfo[0] || {} });
        }

    } catch (err) {
        console.error('Erro ao checar perfil:', err);
        // Se der erro no DB, retornamos os dados básicos de qualquer forma para não travar o frontend
        return res.status(200).json({ profileExists: false, data: { nome_barbeiro: req.user.nome, email: req.user.email } });
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

    // Validação do documento (CPF/CNPJ)
    const cleanedDocumento = String(documento).replace(/\D/g, '');
    if (!isValidDocumento(cleanedDocumento)) {
        return res.status(400).json({ error: 'Documento inválido (CPF ou CNPJ com dígitos incorretos).' });
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
            barbeiro_id, nome_barbeiro, nome_barbearia, cleanedDocumento, String(telefone).replace(/\D/g, ''), rua, numero, bairro, finalComplemento, String(cep).replace(/\D/g, ''), uf, localidade
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
app.put('/perfil/foto', authenticateToken, (req, res) => {
    
    const barbeiro_id = req.user.id; 
    
    // 1. Executa o middleware Multer para processar o arquivo
    upload(req, res, async (err) => {
        
        // Trata erros do Multer (ex: arquivo muito grande)
        if (err instanceof multer.MulterError) {
            console.error("Erro Multer:", err.message);
            return res.status(500).json({ error: "Erro no upload: " + err.message });
        } else if (err) {
            console.error("Erro de Upload Desconhecido:", err);
            return res.status(500).json({ error: "Erro desconhecido durante o upload." });
        }

        let fotoPath = null;
        let oldPath = req.file ? req.file.path : null; 
        let newPath = null; 
        
        // Verifica se uma nova foto foi enviada (req.file existe)
        if (req.file) {
            
            // 🚨 CORREÇÃO: Renomear o arquivo para incluir o ID do barbeiro
            const oldFilename = req.file.filename;
            const filenameWithId = `foto-${barbeiro_id}-${oldFilename}`;
            newPath = path.join(uploadsDir, filenameWithId); 
            
            // Tenta renomear o arquivo
            try {
                fs.renameSync(oldPath, newPath);
                fotoPath = `/uploads/${filenameWithId}`; // Caminho RELATIVO para o DB

            } catch (renameErr) {
                console.error("Falha Crítica ao renomear arquivo:", renameErr);
                fs.unlink(oldPath, () => {}); // Tenta apagar o arquivo temporário
                return res.status(500).json({ error: "Falha ao processar o arquivo no servidor." });
            }

            // Lógica Opcional: Deletar foto antiga (Mantida)
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



// Rota para EXCLUSÃO DA CONTA (Suporta Barbeiro e Cliente)
app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userType = req.user.tipo;

    try {
        let sql;
        let params = [userId];

        if (userType === 'barbeiro' || userType === 'admin') {
            sql = 'DELETE FROM barbeiros WHERE id = ?';
        } else if (userType === 'cliente') {
            sql = 'DELETE FROM clientes WHERE id = ?';
        } else {
            return res.status(400).json({ error: 'Tipo de usuário inválido para exclusão.' });
        }

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Conta não encontrada ou já excluída.' });
        }

        console.log(`Conta do usuário ${userEmail} (ID: ${userId}, tipo: ${userType}) excluída com sucesso.`);
        return res.status(200).json({ message: 'Conta excluída permanentemente. Redirecionando...' });

    } catch (err) {
        console.error('Erro na exclusão de conta:', err);
        return res.status(500).json({ error: 'Erro interno. Verifique as restrições do banco.' });
    }
});


// ==========================================================
// ROTAS DE SERVIÇOS, CLIENTES E AGENDAMENTO (IMPLEMENTADO)
// ==========================================================

// --- ROTAS CRUD DE SERVIÇOS DO BARBEIRO (FINAL) ---

// 1. LISTAR TODOS OS SERVIÇOS DO BARBEIRO LOGADO (READ)
app.get('/servicos/meus', authenticateToken, async (req, res) => {
    try {
        const barbeiro_id = req.user.id;
        // 🚨 O seu frontend GerenciarServicos chama ESTA rota 🚨
        const [servicos] = await db.query('SELECT id, nome, preco, duracao_minutos FROM servicos WHERE barbeiro_id = ? ORDER BY nome', [barbeiro_id]);
        return res.json(servicos);
    } catch (error) {
        console.error("Erro ao listar serviços:", error);
        return res.status(500).json({ error: "Erro interno ao listar serviços." });
    }
});

// 2. CRIAR NOVO SERVIÇO (CREATE)
app.post('/servicos', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { nome, preco, duracao_minutos } = req.body;
    
    if (!nome || preco === undefined || !duracao_minutos) {
        return res.status(400).json({ error: "Nome, preço e duração são obrigatórios." });
    }
    
    try {
        const sql = 'INSERT INTO servicos (barbeiro_id, nome, preco, duracao_minutos) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [barbeiro_id, nome, preco, duracao_minutos]);
        return res.status(201).json({ id: result.insertId, message: "Serviço criado com sucesso!" });
    } catch (error) {
        console.error("Erro ao criar serviço:", error);
        return res.status(500).json({ error: "Erro interno ao criar serviço." });
    }
});

// 3. ATUALIZAR SERVIÇO EXISTENTE (UPDATE)
app.put('/servicos/:id', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const servico_id = req.params.id;
    const { nome, preco, duracao_minutos } = req.body;

    if (!nome || preco === undefined || !duracao_minutos) {
        return res.status(400).json({ error: "Nome, preço e duração são obrigatórios." });
    }

    try {
        const sql = 'UPDATE servicos SET nome = ?, preco = ?, duracao_minutos = ? WHERE id = ? AND barbeiro_id = ?';
        const [result] = await db.query(sql, [nome, preco, duracao_minutos, servico_id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Serviço não encontrado ou você não tem permissão para editá-lo." });
        }
        return res.json({ message: "Serviço atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar serviço:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar serviço." });
    }
});

// 4. DELETAR SERVIÇO (DELETE)
app.delete('/servicos/:id', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const servico_id = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM servicos WHERE id = ? AND barbeiro_id = ?', [servico_id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Serviço não encontrado ou você não tem permissão para deletá-lo." });
        }
        return res.json({ message: "Serviço deletado com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar serviço:", error);
        return res.status(500).json({ error: "Erro interno ao deletar serviço." });
    }
});


// --- ROTAS DE LISTAGEM DE SUPORTE (APIs que o Agendamento precisa) ---

// Rota: GET /clientes
app.get('/clientes', authenticateToken, async (req, res) => {
    try {
        const [clientes] = await db.query('SELECT id, nome, telefone FROM clientes ORDER BY nome');
        return res.json(clientes);
    } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        return res.status(500).json({ error: "Erro interno ao buscar clientes." });
    }
});

// Rota: GET /barbeiros
app.get('/barbeiros', authenticateToken, async (req, res) => {
    try {
        const [barbeiros] = await db.query('SELECT id, nome FROM barbeiros WHERE tipo_usuario = "barbeiro" AND status_ativacao = "ativa" ORDER BY nome');
        return res.json(barbeiros);
    } catch (error) {
        console.error("Erro ao buscar barbeiros:", error);
        return res.status(500).json({ error: "Erro interno ao buscar barbeiros." });
    }
});

// Rota: GET /servicos (Geral - para o Agendamento)
app.get('/servicos', authenticateToken, async (req, res) => {
    try {
        const [servicos] = await db.query('SELECT id, nome, duracao_minutos, preco FROM servicos ORDER BY nome');
        return res.json(servicos);
    } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        return res.status(500).json({ error: "Erro interno ao buscar serviços." });
    }
});

// Rota: GET /servicos/:servicoId
// Funcionalidade: Busca os detalhes de um serviço específico
app.get('/servicos/:servicoId', async (req, res) => {
    const { servicoId } = req.params;

    try {
        // Seleciona as colunas essenciais da tabela 'servicos'
        const sql = 'SELECT id, nome, preco, duracao_minutos FROM servicos WHERE id = ?';
        // Assumindo que 'db' é o seu pool de conexão MySQL
        const [servico] = await db.query(sql, [servicoId]);
        
        if (servico.length === 0) {
            return res.status(404).json({ error: "Serviço não encontrado." });
        }
        
        // Retorna apenas o primeiro (e único) resultado
        return res.json(servico[0]);
        
    } catch (error) {
        console.error("Erro ao buscar serviço por ID:", error);
        return res.status(500).json({ error: "Erro interno ao buscar serviço." });
    }
});


// ==========================================================
// ROTAS CRUD DE HORÁRIOS DE ATENDIMENTO
// ==========================================================

// 1. LISTAR HORÁRIOS DO BARBEIRO LOGADO (READ)
app.get('/horarios/meus', authenticateToken, async (req, res) => {
    try {
        const barbeiro_id = req.user.id;
        // Ordena por dia da semana (ajuste a ordem se necessário, ex: de 1 a 7)
        const [horarios] = await db.query('SELECT id, dia_semana, hora_inicio, hora_fim FROM horarios_atendimento WHERE barbeiro_id = ? ORDER BY FIELD(dia_semana, "segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"), hora_inicio', [barbeiro_id]);
        return res.json(horarios);
    } catch (error) {
        console.error("Erro ao listar horários:", error);
        return res.status(500).json({ error: "Erro interno ao listar horários." });
    }
});

// 2. CRIAR NOVO HORÁRIO (CREATE)
app.post('/horarios', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { dia_semana, hora_inicio, hora_fim } = req.body; 
    
    if (!dia_semana || !hora_inicio || !hora_fim) {
        return res.status(400).json({ error: "Dia da semana, hora de início e fim são obrigatórios." });
    }
    
    // Validação de horário básico: Hora fim não pode ser antes ou igual à hora início
    if (hora_inicio >= hora_fim) {
         return res.status(400).json({ error: "A hora de início deve ser anterior à hora de fim." });
    }
    
    try {
        const sql = 'INSERT INTO horarios_atendimento (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [barbeiro_id, dia_semana, hora_inicio, hora_fim]);
        
        return res.status(201).json({ id: result.insertId, message: "Horário de atendimento criado com sucesso!" });
    } catch (error) {
        console.error("Erro ao criar horário:", error);
        return res.status(500).json({ error: "Erro interno ao criar horário." });
    }
});

// 3. ATUALIZAR HORÁRIO EXISTENTE (UPDATE)
app.put('/horarios/:id', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const horario_id = req.params.id;
    const { dia_semana, hora_inicio, hora_fim } = req.body; 

    if (!dia_semana || !hora_inicio || !hora_fim) {
        return res.status(400).json({ error: "Dia da semana, hora de início e fim são obrigatórios." });
    }

    if (hora_inicio >= hora_fim) {
         return res.status(400).json({ error: "A hora de início deve ser anterior à hora de fim." });
    }
    
    try {
        const sql = 'UPDATE horarios_atendimento SET dia_semana = ?, hora_inicio = ?, hora_fim = ? WHERE id = ? AND barbeiro_id = ?';
        const [result] = await db.query(sql, [dia_semana, hora_inicio, hora_fim, horario_id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Horário não encontrado ou você não tem permissão para editá-lo." });
        }
        return res.json({ message: "Horário atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar horário:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar horário." });
    }
});

// 4. DELETAR HORÁRIO (DELETE)
app.delete('/horarios/:id', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const horario_id = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM horarios_atendimento WHERE id = ? AND barbeiro_id = ?', [horario_id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Horário não encontrado ou você não tem permissão para deletá-lo." });
        }
        return res.json({ message: "Horário deletado com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar horário:", error);
        return res.status(500).json({ error: "Erro interno ao deletar horário." });
    }
});
// -----------------------------------------------------------------
// ROTAS DE AGENDAMENTO (IMPLEMENTAÇÃO COMPLETA)
// -----------------------------------------------------------------

// Rota Crítica: POST /agendamentos (Criação com Validação de Conflito)
// server.js (Localize e atualize a rota POST /agendamentos)

// server.js (Rota POST /agendamentos)

app.post('/agendamentos', authenticateToken, async (req, res) => {
    // 1. Extração dos dados (TODOS OS CAMPOS)
    const { cliente_id, barbeiro_id, servico_id, data_hora_inicio, valor_servico, observacao, preferencia } = req.body; 
    
    // Validação básica
    if (!cliente_id || !barbeiro_id || !servico_id || !data_hora_inicio || valor_servico === undefined) {
        return res.status(400).json({ error: "Dados incompletos para agendamento." });
    }

    try {
        // 2. Busca a Duração do Serviço (Para calcular data_hora_fim)
        const [servicoRows] = await db.query('SELECT duracao_minutos FROM servicos WHERE id = ?', [servico_id]);
        
        if (servicoRows.length === 0) {
            return res.status(404).json({ error: "Serviço não encontrado." });
        }
        
        const duracao_minutos = servicoRows[0].duracao_minutos;

        // 3. Cálculo do Intervalo de Tempo (CORREÇÃO DE FUSO HORÁRIO)
        // Adicionamos 'T' entre data e hora para garantir que o objeto Date seja criado 
        // sem deslocamento do fuso horário local do servidor (corrigindo o erro de 3 horas).
        const localDateTimeString = data_hora_inicio.replace(' ', 'T'); 
const inicio = new Date(localDateTimeString);

if (isNaN(inicio.getTime())) {
     return res.status(400).json({ error: "Formato de data/hora de início inválido." });
}

const fim = new Date(inicio.getTime() + duracao_minutos * 60000); 

// 2. FUNÇÃO AUXILIAR: Formata o objeto Date para YYYY-MM-DD HH:MM:SS local
// *IGNORANDO O DESLOCAMENTO DE FUSO HORÁRIO DO SERVIDOR/ISOSTRING()*
const toLocalSQLString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 3. Formatação para SQL (USA HORA LOCAL EXATA)
const data_inicio_sql = toLocalSQLString(inicio);
const data_fim_sql = toLocalSQLString(fim);
        
        // 4. Lógica de Conflito (Checa se o barbeiro está livre - MANTIDA)
        const sqlConflito = `
            SELECT id FROM agendamentos 
            WHERE barbeiro_id = ? 
            AND status != 'cancelado' 
            AND (
                (data_hora_inicio < ? AND data_hora_fim > ?) OR 
                (data_hora_inicio >= ? AND data_hora_inicio < ?) 
            )
        `;

        const [conflitos] = await db.query(sqlConflito, [
            barbeiro_id,
            data_fim_sql, data_inicio_sql,
            data_inicio_sql, data_fim_sql
        ]);

        if (conflitos.length > 0) {
            return res.status(409).json({ error: "Conflito de horário! O barbeiro já está ocupado neste período." });
        }

        // 5. Inserção do Agendamento (COM TODOS OS CAMPOS)
        const sqlInsert = `
            INSERT INTO agendamentos 
            (cliente_id, barbeiro_id, servico_id, data_hora_inicio, data_hora_fim, status, valor_servico, observacao, preferencia) 
            VALUES (?, ?, ?, ?, ?, 'agendado', ?, ?, ?)
        `;
        const [result] = await db.query(sqlInsert, [
            cliente_id, 
            barbeiro_id, 
            servico_id, 
            data_inicio_sql, 
            data_fim_sql, 
            parseFloat(valor_servico),
            observacao || null, 
            preferencia || null
        ]);

        return res.status(201).json({ id: result.insertId, message: "Agendamento criado com sucesso!", data_fim: data_fim_sql });

    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        return res.status(500).json({ error: 'Erro interno ao agendar o serviço.' });
    }
});


// Rota: GET /agendamentos (Lista para o Calendário)
// server.js (Localize e atualize a rota GET /agendamentos)

app.get('/agendamentos', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    
    // 1. Definição da Data Atual e Data de HOJE (apenas YYYY-MM-DD)
    const now = new Date().toISOString().slice(0, 19).replace('T', ' '); 
    const today = new Date().toISOString().substring(0, 10);
    
    try {
        const sql = `
            SELECT 
                a.id, a.data_hora_inicio, a.data_hora_fim, a.status, a.valor_servico, a.observacao, a.preferencia, a.motivo_cancelamento, a.cancelado_por,
                c.nome AS nome_cliente, 
                s.nome AS nome_servico
            FROM agendamentos a
            JOIN clientes c ON a.cliente_id = c.id
            JOIN servicos s ON a.servico_id = s.id
            
            /* FILTRO DE BASE: A data de início deve ser HOJE ou no FUTURO. */
            WHERE DATE(a.data_hora_inicio) >= ? 
            AND a.barbeiro_id = ? 
            
            /* * ORDENAÇÃO DE PRIORIDADE:
             * 1. HOJE vs. FUTURO: 0 se for HOJE, 1 se for FUTURO. (HOJE VEM PRIMEIRO)
             * 2. STATUS: 0 se for AGENDADO (Pendente), 1 se for Concluído/Cancelado.
             * 3. CRONOLOGIA: Hora mais cedo primeiro.
             */
            ORDER BY 
                CASE WHEN DATE(a.data_hora_inicio) = ? THEN 0 ELSE 1 END,
                CASE WHEN a.status = 'agendado' THEN 0 ELSE 1 END,
                a.data_hora_inicio ASC
        `;
        
        // Passamos 'today' (data YYYY-MM-DD) para o filtro WHERE e para o filtro CASE
        const [agendamentos] = await db.query(sql, [today, barbeiro_id, today]);

        return res.json(agendamentos);

    } catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        return res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
    }
});

// Rota: PUT /agendamentos/:id (Atualiza status para 'concluido' ou 'cancelado')
app.put('/agendamentos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id;
    const { status } = req.body; 

    if (!status || (status !== 'concluido' && status !== 'cancelado')) {
        return res.status(400).json({ error: "Status inválido." });
    }

    try {
        const sql = 'UPDATE agendamentos SET status = ? WHERE id = ? AND barbeiro_id = ?';
        const [result] = await db.query(sql, [status, id, barbeiro_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Agendamento não encontrado ou acesso negado." });
        }
        
        return res.status(200).json({ message: `Agendamento ID ${id} marcado como ${status}.` });

    } catch (error) {
        console.error("Erro ao atualizar agendamento:", error);
        return res.status(500).json({ error: "Erro interno ao atualizar agendamento." });
    }
});


// server.js (Adicione esta nova rota)

// Rota: PUT /agendamentos/:id/status
// server.js (Localize e substitua a rota PUT /agendamentos/:id/status)

app.put('/agendamentos/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, motivo } = req.body; 
    
    // DEFINIÇÕES DE SEGURANÇA BASEADAS NO TIPO
    const userType = req.user.tipo;
    const userIdLogado = req.user.id;
    
    // A rota deve ser acessível tanto pelo barbeiro quanto pelo cliente (para cancelar)
    const clienteId = userType === 'cliente' ? userIdLogado : null;
    const barbeiroId = userType === 'barbeiro' ? userIdLogado : null;
    
    // 1. Validação de Status
    if (!['concluido', 'cancelado'].includes(status)) {
        return res.status(400).json({ error: "Status inválido fornecido. Use 'cancelado' ou 'concluido'." });
    }

    let query = `
        UPDATE agendamentos 
        SET status = ?
    `;
    let params = [status];
    
    // 2. ADICIONA O MOTIVO DE CANCELAMENTO E QUEM CANCELou (APENAS SE O STATUS FOR CANCELADO)
    if (status === 'cancelado') {
        if (motivo) {
            query += `, motivo_cancelamento = ?`;
            params.push(motivo);
        }

        // Indica quem realizou o cancelamento: 'barbeiro' ou 'cliente'
        const canceladoPor = userType === 'barbeiro' ? 'barbeiro' : (userType === 'cliente' ? 'cliente' : null);
        if (canceladoPor) {
            query += `, cancelado_por = ?`;
            params.push(canceladoPor);
        }
    }
    
    // 3. FILTROS DE SEGURANÇA (Para garantir que apenas o dono/barbeiro responsável altere)
    query += ` WHERE id = ?`;
    params.push(id);

    // Se for um barbeiro logado, ele só pode alterar status dos agendamentos dele
    if (barbeiroId) {
        query += ` AND barbeiro_id = ?`;
        params.push(barbeiroId);
    } 
    // Se for um cliente logado, ele só pode CANCELAR os agendamentos DELE (e só se estiver 'agendado')
    else if (clienteId && status === 'cancelado') {
        query += ` AND cliente_id = ? AND status = 'agendado'`;
        params.push(clienteId);
    } 
    // Cliente não pode marcar como 'concluido' ou alterar agendamentos de outros

    try {
        // 4. Executa a Query usando o objeto DB
        const [result] = await db.query(query, params); // <--- CORREÇÃO AQUI
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Agendamento não encontrado ou sem permissão para alteração." });
        }
        
        return res.json({ message: `Agendamento ${id} atualizado para ${status} com sucesso.` });
        
    } catch (error) {
        console.error(`Erro ao atualizar status do agendamento ${id}:`, error);
        return res.status(500).json({ error: 'Erro interno ao atualizar o agendamento.' });
    }
});



// Rota: DELETE /agendamentos/:id (Placeholder)
app.delete('/agendamentos/:id', authenticateToken, (req, res) => { res.status(501).json({ error: "Rota DELETE Agendamento não implementada. Use PUT para status 'cancelado'." }); });



// Rota: GET /barbearias/busca?query=TERRA
// Funcionalidade: Busca barbearias ativas por nome, barbearia ou localidade
app.get('/barbearias/busca', async (req, res) => {
    // O parâmetro 'query' é opcional para filtrar por nome/local
    const { query } = req.query; 

    try {
        let sql = `
            SELECT 
                b.id AS barbeiro_id, 
                pb.nome_barbearia,
                pb.rua,
                pb.numero,
                pb.bairro,
                pb.localidade,
                pb.uf,
                b.foto_perfil,
                b.nome AS nome_barbeiro
            FROM barbeiros b
            JOIN perfil_barbeiro pb ON b.id = pb.barbeiro_id
            WHERE b.status_ativacao = 'ativa' 
            AND b.tipo_usuario IN ('barbeiro', 'admin') 
        `;
        const params = [];
        
        // Adiciona a cláusula de busca se a query estiver presente
        if (query) {
            const searchQuery = `%${query}%`;
            sql += ` AND (pb.nome_barbearia LIKE ? OR b.nome LIKE ? OR pb.localidade LIKE ?)`;
            params.push(searchQuery, searchQuery, searchQuery);
        }
        
        sql += ` ORDER BY pb.nome_barbearia ASC`;

        // Assumindo que 'db' é o seu pool de conexão MySQL
        const [barbearias] = await db.query(sql, params);

        // Processa os dados para adicionar a URL completa da foto
        const barbeariasFormatadas = barbearias.map(barbearia => ({
            ...barbearia,
            // Construção da URL da foto, assumindo que o Node.js serve arquivos estáticos
            foto_url: barbearia.foto_perfil ? `http://localhost:3000${barbearia.foto_perfil}` : null
        }));

        return res.json(barbeariasFormatadas);

    } catch (error) {
        console.error("Erro ao buscar barbearias:", error);
        return res.status(500).json({ error: "Erro interno ao buscar barbearias." });
    }
});


// server.js (Adicionar esta rota ou verificar se ela está correta)
// Rota: GET /servicos/barbeiro/:barbeiroId
// Funcionalidade: Lista todos os serviços ATIVOS de um barbeiro específico
app.get('/servicos/barbeiro/:barbeiroId', async (req, res) => {
    // O ID do barbeiro vem da URL que o frontend chamou
    const { barbeiroId } = req.params;

    try {
        // Seleciona as colunas essenciais da tabela 'servicos'
        const sql = 'SELECT id, nome, preco, duracao_minutos, barbeiro_id FROM servicos WHERE barbeiro_id = ? ORDER BY nome';
        const [servicos] = await db.query(sql, [barbeiroId]);
        
        // CORREÇÃO ESSENCIAL: O preço e a duração devem ser formatados ou validados
        const servicosFormatados = servicos.map(s => ({
            ...s,
            preco: parseFloat(s.preco).toFixed(2), // Garante duas casas decimais
            // A duração já está em minutos e é um número
        }));

        return res.json(servicosFormatados);
        
    } catch (error) {
        console.error("Erro ao listar serviços de barbeiro:", error);
        return res.status(500).json({ error: "Erro interno ao buscar serviços do profissional." });
    }
});


app.get('/barbearia/:barbeiroId/detalhes', async (req, res) => {
    const { barbeiroId } = req.params;

    try {
        const sql = `
            SELECT 
                b.id AS barbeiro_id, 
                pb.nome_barbearia,
                pb.rua,
                pb.numero,
                pb.bairro,
                pb.localidade,
                pb.uf,
                b.foto_perfil,
                b.nome AS nome_barbeiro,
                b.email
            FROM barbeiros b
            JOIN perfil_barbeiro pb ON b.id = pb.barbeiro_id
            WHERE b.id = ? 
            AND b.status_ativacao = 'ativa' 
            AND b.tipo_usuario IN ('barbeiro', 'admin')
        `;
        const [results] = await db.query(sql, [barbeiroId]);

        if (results.length === 0) {
            return res.status(404).json({ error: "Barbearia não encontrada ou inativa." });
        }
        
        const barbearia = results[0];
        // Adiciona a URL completa da foto para o Frontend
        barbearia.foto_url = barbearia.foto_perfil ? `http://localhost:3000${barbearia.foto_perfil}` : null;

        return res.json(barbearia);

    } catch (error) {
        console.error("Erro ao buscar detalhes da barbearia:", error);
        return res.status(500).json({ error: "Erro interno ao buscar detalhes." });
    }
});


// src/server.js (Nova Rota)

// Rota: GET /barbearia/:barbeiroPrincipalId/profissionais
// Objetivo: Listar o Barbeiro Principal + quaisquer outros profissionais vinculados
app.get('/barbearia/:barbeiroPrincipalId/profissionais', async (req, res) => {
    const { barbeiroPrincipalId } = req.params;

    // Se você não tem um conceito de "sub-barbeiros" no DB, apenas liste o principal
    // (Ajuste esta query se tiver uma tabela de 'BarbeiroSecundario' ou 'Funcionario')
    const sql = 'SELECT id, nome, foto_perfil FROM barbeiros WHERE id = ? AND status_ativacao = "ativa"';
    
    try {
        const [profissionais] = await db.query(sql, [barbeiroPrincipalId]);

        if (profissionais.length === 0) {
            return res.status(404).json({ error: "Nenhum profissional ativo encontrado nesta unidade." });
        }
        
        // Simulação: Se você tivesse sub-barbeiros, o código para buscá-los viria aqui
        // Mas por enquanto, retorna apenas o principal
        
        return res.json(profissionais.map(p => ({
            id: p.id,
            nome: p.nome,
            foto_url: p.foto_perfil ? `http://localhost:3000${p.foto_perfil}` : null
        })));
        
    } catch (error) {
        console.error("Erro ao listar profissionais da unidade:", error);
        return res.status(500).json({ error: "Erro interno." });
    }
});


// src/server.js (Nova Rota Crítica)

// Rota: GET /agendamento/:barbeiroId/disponibilidade/:data/:servicoId
// Objetivo: Retorna a lista de horários de início disponíveis para aquele serviço e data.
// server.js (Substitua a rota existente)

app.get('/agendamento/:barbeiroId/disponibilidade/:data/:servicoId', async (req, res) => {
    const { barbeiroId, data: dataString, servicoId } = req.params;

    // Determina o dia da semana (para checar horarios_atendimento)
    const date = new Date(dataString + 'T00:00:00'); 
    const diaSemanaIndex = date.getDay(); 
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dia_semana = dias[diaSemanaIndex];

    try {
        // 1. 🚨 CHECAGEM CRÍTICA: VERIFICA SE A DATA ESTÁ BLOQUEADA 🚨
        const sqlBloqueio = 'SELECT reason FROM blocked_dates WHERE barbeiro_id = ? AND date = ?';
        const [bloqueio] = await db.query(sqlBloqueio, [barbeiroId, dataString]); // dataString é 'YYYY-MM-DD'

        if (bloqueio.length > 0) {
            // Se a data estiver bloqueada, retorna imediatamente com uma mensagem
            return res.json({ 
                disponiveis: [], 
                message: `Data bloqueada devido a: ${bloqueio[0].reason || 'Dia de folga/Feriado'}.`
            });
        }
        
        // 2. Busca a Duração do Serviço (necessário para calcular slots)
        const [servicoRows] = await db.query('SELECT duracao_minutos FROM servicos WHERE id = ?', [servicoId]);
        if (servicoRows.length === 0) {
            return res.status(404).json({ error: "Serviço não encontrado." });
        }
        const duracao_minutos = servicoRows[0].duracao_minutos;

        // 3. Busca o Horário de Atendimento (Regra)
        const sqlHorario = 'SELECT hora_inicio, hora_fim FROM horarios_atendimento WHERE barbeiro_id = ? AND dia_semana = ?';
        const [horariosTrabalho] = await db.query(sqlHorario, [barbeiroId, dia_semana]);

        if (horariosTrabalho.length === 0) {
            return res.json({ disponiveis: [], message: `O profissional não trabalha na ${dia_semana}.` });
        }

        // 4. Busca os Agendamentos Existentes (Conflitos)
        const dataInicio = `${dataString} 00:00:00`;
        const dataFim = `${dataString} 23:59:59`;
        const sqlConflitos = `
            SELECT data_hora_inicio, data_hora_fim FROM agendamentos 
            WHERE barbeiro_id = ? 
            AND status != 'cancelado' 
            AND data_hora_inicio BETWEEN ? AND ?
        `;
        const [agendamentosOcupados] = await db.query(sqlConflitos, [barbeiroId, dataInicio, dataFim]);
        
        // 5. LÓGICA DE GERAÇÃO DE SLOTS (Mantida do seu código original)
        const slotsDisponiveis = [];

        for (const horario of horariosTrabalho) {
            let currentTime = new Date(`${dataString}T${horario.hora_inicio}`);
            const endTime = new Date(`${dataString}T${horario.hora_fim}`);
            
            while (currentTime.getTime() + duracao_minutos * 60000 <= endTime.getTime()) {
                const slotEnd = new Date(currentTime.getTime() + duracao_minutos * 60000);
                let isAvailable = true;

                for (const agendamento of agendamentosOcupados) {
                    const bookedStart = new Date(agendamento.data_hora_inicio);
                    const bookedEnd = new Date(agendamento.data_hora_fim);

                    if (
                        currentTime.getTime() < bookedEnd.getTime() && 
                        slotEnd.getTime() > bookedStart.getTime()
                    ) {
                        isAvailable = false;
                        currentTime = bookedEnd; 
                        break;
                    }
                }

                if (isAvailable) {
                    slotsDisponiveis.push(
                        currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    );
                    currentTime = new Date(currentTime.getTime() + duracao_minutos * 60000);
                }
            }
        }

        return res.json({ disponiveis: slotsDisponiveis, message: "Horários calculados com sucesso." });

    } catch (error) {
        console.error("Erro no cálculo de disponibilidade:", error);
        return res.status(500).json({ error: "Erro interno no cálculo." });
    }
});

// server.js (Nova Rota de Listagem para o Cliente)

// Rota: GET /agendamentos/cliente/:clienteId
app.get('/agendamentos/cliente/:clienteId', authenticateToken, async (req, res) => {
    const { clienteId } = req.params;
    const userIdLogado = req.user.id;
    const userType = req.user.tipo; // Pega o tipo de usuário do token

    // 1. Verificação de Segurança (Garante que o cliente só veja os próprios agendamentos)
    // Se não for um cliente tentando ver seu próprio ID, ou se não for um barbeiro/admin, bloqueia.
    if (userType === 'cliente' && String(clienteId) !== String(userIdLogado)) {
        return res.status(403).json({ error: "Acesso negado. Você só pode visualizar seus próprios agendamentos." });
    }
    
    // Nota: Se a rota for chamada pelo Barbeiro (que também é 'clienteId' no agendamento), 
    // ele verá os agendamentos dele como cliente. Se o Barbeiro quiser ver todos os 
    // agendamentos da barbearia, ele usará a rota /agendamentos (geral).

    try {
        const sql = `
            SELECT 
                a.id, a.data_hora_inicio, a.data_hora_fim, a.status, a.valor_servico, a.observacao, a.preferencia, a.motivo_cancelamento, a.cancelado_por,
                b.nome AS nome_barbeiro, 
                s.nome AS nome_servico
            FROM agendamentos a
            JOIN barbeiros b ON a.barbeiro_id = b.id
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.cliente_id = ?
            ORDER BY a.data_hora_inicio DESC
        `;
        
        const [agendamentos] = await db.query(sql, [clienteId]);

        return res.json(agendamentos);

    } catch (error) {
        console.error("Erro ao listar agendamentos do cliente:", error);
        return res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
    }
});



// server.js (Nova Rota: GET /agendamentos/data)

app.get('/agendamentos/data', authenticateToken, async (req, res) => {
    // A data é enviada como parâmetro de query, ex: /agendamentos/data?data=2025-11-15
    const { data } = req.query; 
    const barbeiro_id = req.user.id;
    
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: "O parâmetro 'data' é obrigatório e deve ser YYYY-MM-DD." });
    }

    try {
        const sql = `
            SELECT 
                a.id, a.data_hora_inicio, a.data_hora_fim, a.status, a.valor_servico, a.observacao, a.preferencia, a.motivo_cancelamento, a.cancelado_por,
                c.nome AS nome_cliente, 
                s.nome AS nome_servico
            FROM agendamentos a
            JOIN clientes c ON a.cliente_id = c.id
            JOIN servicos s ON a.servico_id = s.id
            WHERE a.barbeiro_id = ? 
            AND DATE(a.data_hora_inicio) = ? 
            
            /* Priorização: Agendados vêm primeiro, depois ordem cronológica */
            ORDER BY 
                CASE WHEN a.status = 'agendado' THEN 0 ELSE 1 END,
                a.data_hora_inicio ASC
        `;
        
        const [agendamentos] = await db.query(sql, [barbeiro_id, data]);

        return res.json(agendamentos);

    } catch (error) {
        console.error("Erro ao pesquisar agendamentos por data:", error);
        return res.status(500).json({ error: "Erro interno ao buscar agendamentos pela data." });
    }
});


// Exemplo de rota de POST para o Backend (A ser adicionada no Server.js)

// Rota POST /blocked-dates
// server.js (Rotas para Gerenciar Dias Bloqueados)

// Rota POST: Adiciona um dia bloqueado
app.post('/blocked-dates', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    const { date, reason } = req.body; // date deve ser YYYY-MM-DD

    if (!date) {
        return res.status(400).json({ error: "A data é obrigatória." });
    }

    try {
        const sql = 'INSERT INTO blocked_dates (barbeiro_id, date, reason) VALUES (?, ?, ?)';
        const [result] = await db.query(sql, [barbeiro_id, date, reason || null]);
        
        return res.status(201).json({ message: "Dia bloqueado com sucesso!", id: result.insertId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ error: "Esta data já está bloqueada." });
        }
        console.error("Erro ao bloquear data:", error);
        return res.status(500).json({ error: "Erro interno ao bloquear data." });
    }
});

// Rota GET: Lista dias bloqueados do barbeiro
app.get('/blocked-dates/meus', authenticateToken, async (req, res) => {
    const barbeiro_id = req.user.id;
    try {
        const [dias] = await db.query('SELECT id, date, reason, created_at FROM blocked_dates WHERE barbeiro_id = ? ORDER BY date ASC', [barbeiro_id]);
        return res.json(dias);
    } catch (error) {
        console.error("Erro ao listar dias bloqueados:", error);
        return res.status(500).json({ error: "Erro interno ao listar dias bloqueados." });
    }
});

// Rota DELETE: Remove um dia bloqueado
app.delete('/blocked-dates/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const barbeiro_id = req.user.id;
    try {
        const [result] = await db.query('DELETE FROM blocked_dates WHERE id = ? AND barbeiro_id = ?', [id, barbeiro_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Dia bloqueado não encontrado ou acesso negado." });
        }
        return res.json({ message: "Dia bloqueado removido com sucesso." });
    } catch (error) {
        console.error("Erro ao deletar dia bloqueado:", error);
        return res.status(500).json({ error: "Erro interno ao deletar dia bloqueado." });
    }
});

// server.js (Nova Rota: POST /comanda/fechar)

// server.js (Nova Rota: POST /comanda/fechar - SEM COMISSÃO)

app.post('/comanda/fechar', authenticateToken, async (req, res) => {
    // Adicionando os novos campos à desestruturação
    const { agendamento_id, valor_cobrado, forma_pagamento, 
            avaliacao_cliente_nota, avaliacao_cliente_obs } = req.body; 
    const barbeiro_id = req.user.id; 

    if (!agendamento_id || valor_cobrado === undefined || !forma_pagamento) {
        return res.status(400).json({ error: "Dados de fechamento incompletos." });
    }
    
    const valorCobrado = parseFloat(valor_cobrado);

    // Inicia a transação
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. CALCULAR TAXA (Se for cartão)
        let valorLiquido = valorCobrado;
        let taxaValor = 0;
        
        if (forma_pagamento === 'cartao') {
            // Buscamos a taxa do barbeiro logado
            const taxaMaquininha = await getTaxaCartao(barbeiro_id); 
            taxaValor = valorCobrado * (taxaMaquininha / 100);
            valorLiquido = valorCobrado - taxaValor;
        }

        // 2. REGISTRAR MOVIMENTAÇÃO FINANCEIRA (Receita Líquida/Bruta)
        const descricaoReceita = `Receita - Agendamento #${agendamento_id} (${forma_pagamento})`;
        const sqlInsertReceita = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
        
        await connection.query(sqlInsertReceita, [
            barbeiro_id,
            descricaoReceita,
            valorLiquido, // Salva o valor líquido/bruto
            'receita',
            'servico',
            forma_pagamento
        ]);

        // 3. REGISTRAR MOVIMENTAÇÃO FINANCEIRA (Despesa da Taxa, se houver)
        if (taxaValor > 0) {
            const descricaoTaxa = `Despesa - Taxa Cartão Ref: Agd #${agendamento_id}`;
            const sqlInsertTaxa = 'INSERT INTO movimentacoes_financeiras (barbeiro_id, descricao, valor, tipo, categoria, forma_pagamento) VALUES (?, ?, ?, ?, ?, ?)';
            await connection.query(sqlInsertTaxa, [
                barbeiro_id,
                descricaoTaxa,
                taxaValor,
                'despesa',
                'taxa',
                'cartao'
            ]);
        }
        
        // 4. ATUALIZAR STATUS DO AGENDAMENTO PARA 'concluido'
        const sqlUpdateAgendamento = `
            UPDATE agendamentos 
            SET 
                status = ?, 
                valor_servico = ?,
                avaliacao_cliente_nota = ?,  
                avaliacao_cliente_obs = ?    
            WHERE id = ? AND barbeiro_id = ?
        `;

        await connection.query(sqlUpdateAgendamento, [
            'concluido', 
            valorCobrado, 
            avaliacao_cliente_nota, 
            avaliacao_cliente_obs || null, 
            agendamento_id, 
            barbeiro_id
        ]);

        // Fim da transação: Confirma todas as operações
        await connection.commit();
        connection.release();

        return res.status(200).json({ 
            message: "Comanda fechada e receita registrada com sucesso!",
            valor_receita: valorLiquido
        });

    } catch (error) {
        // Se algo falhar, desfaz todas as operações
        await connection.rollback();
        connection.release();
        
        console.error("Erro no fechamento da comanda:", error);
        return res.status(500).json({ error: `Falha ao fechar comanda. As alterações foram desfeitas.` });
    }
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Rota: GET /perfil/documento-exists?documento=...
// Objetivo: verificar rapidamente se um CPF/CNPJ já está cadastrado (retorna { exists: true/false })
app.get('/perfil/documento-exists', async (req, res) => {
    const { documento } = req.query;
    if (!documento) return res.status(400).json({ error: 'Parâmetro documento é obrigatório.' });

    const cleaned = String(documento).replace(/\D/g, '');
    if (!isValidDocumento(cleaned)) {
        return res.status(400).json({ error: 'Documento inválido (CPF/CNPJ com dígitos incorretos).' });
    }

    try {
        const [rows] = await db.query('SELECT barbeiro_id FROM perfil_barbeiro WHERE documento = ?', [cleaned]);
        return res.json({ exists: rows && rows.length > 0 });
    } catch (err) {
        console.error('Erro ao checar documento:', err);
        return res.status(500).json({ error: 'Erro interno ao checar documento.' });
    }
});

// Rota: GET /perfil/cliente - Retorna os dados do cliente logado
app.get('/perfil/cliente', authenticateToken, async (req, res) => {
    const cliente_id = req.user.id;
    try {
        // Verifica se a coluna 'documento' existe na tabela 'clientes' do schema atual
        const [colCheck] = await db.query(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'documento'`,
            [process.env.DB_NAME]
        );
        const hasDocumento = colCheck && colCheck[0] && colCheck[0].cnt > 0;

        const sql = hasDocumento
            ? 'SELECT id, nome, email, telefone, documento FROM clientes WHERE id = ?'
            : 'SELECT id, nome, email, telefone FROM clientes WHERE id = ?';

        const [rows] = await db.query(sql, [cliente_id]);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        // Se não existir documento, garantimos que o campo esteja presente com null para o frontend
        const row = rows[0];
        if (!hasDocumento) row.documento = null;
        return res.json({ data: row });
    } catch (err) {
        console.error('Erro ao buscar perfil do cliente:', err);
        return res.status(500).json({ error: 'Erro interno ao buscar perfil do cliente.' });
    }
});

// Rota: POST /perfil/cliente - Atualiza os dados do cliente logado
app.post('/perfil/cliente', authenticateToken, async (req, res) => {
    const cliente_id = req.user.id;
    const { nome, telefone, documento } = req.body;

    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

    try {
        const cleanedDocumento = documento ? String(documento).replace(/\D/g, '') : null;
        if (cleanedDocumento && cleanedDocumento.length !== 11) {
            return res.status(400).json({ error: 'Documento inválido. Use CPF válido com 11 dígitos.' });
        }

        // Verifica se a coluna 'documento' existe para decidir se atualizamos também esse campo
        const [colCheck] = await db.query(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'documento'`,
            [process.env.DB_NAME]
        );
        const hasDocumento = colCheck && colCheck[0] && colCheck[0].cnt > 0;

        if (hasDocumento && cleanedDocumento) {
            const sql = 'UPDATE clientes SET nome = ?, telefone = ?, documento = ? WHERE id = ?';
            await db.query(sql, [nome, telefone || null, cleanedDocumento, cliente_id]);
        } else {
            const sql = 'UPDATE clientes SET nome = ?, telefone = ? WHERE id = ?';
            await db.query(sql, [nome, telefone || null, cliente_id]);
        }

        return res.json({ message: 'Perfil do cliente atualizado com sucesso.' });

    } catch (err) {
        console.error('Erro ao atualizar perfil do cliente:', err);
        return res.status(500).json({ error: 'Erro interno ao atualizar perfil.' });
    }
});

// Rota: GET /perfil/email-exists?email=...
// Objetivo: verificar rapidamente se um email já está cadastrado em barbeiros OU clientes
app.get('/perfil/email-exists', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Parâmetro email é obrigatório.' });

    try {
        const [rows] = await db.query(
            `SELECT 'barbeiro' as origem, id FROM barbeiros WHERE email = ? UNION SELECT 'cliente' as origem, id FROM clientes WHERE email = ?`,
            [email, email]
        );
        return res.json({ exists: rows && rows.length > 0 });
    } catch (err) {
        console.error('Erro ao checar email:', err);
        return res.status(500).json({ error: 'Erro interno ao checar email.' });
    }
});

// Rota: POST /auth/forgot-password
// Recebe { email } e, se existir conta, gera token e envia email com link (resposta genérica sempre)
app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body || {};
    const genericResp = { message: 'Se houver conta associada, enviamos um email com instruções.' };
    if (!email) return res.status(400).json({ error: 'Email é obrigatório.' });

    try {
        // localiza conta (barbeiro ou cliente)
        const [rows] = await db.query(
            `SELECT 'barbeiro' as tipo, id FROM barbeiros WHERE email = ? UNION SELECT 'cliente' as tipo, id FROM clientes WHERE email = ?`,
            [email, email]
        );
        if (!rows || rows.length === 0) {
            // não indicar que email não existe
            return res.json(genericResp);
        }

        // gera token e salva hash
        const token = generateResetToken();
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000);

        await db.query('INSERT INTO password_reset_tokens (email, token_hash, expires_at) VALUES (?, ?, ?)', [email, tokenHash, expiresAt]);

        // cria link para frontend
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

        // envia email (ou loga em dev)
        try {
            await sendResetEmail(email, resetLink);
        } catch (mailErr) {
            console.error('Falha ao enviar email de reset:', mailErr);
        }

        return res.json(genericResp);
    } catch (err) {
        console.error('Erro no forgot-password:', err);
        return res.json(genericResp);
    }
});

// Rota: POST /auth/reset-password
// Recebe { token, email, newPassword }
app.post('/auth/reset-password', async (req, res) => {
    const { token, email, newPassword } = req.body || {};
    if (!token || !email || !newPassword) return res.status(400).json({ error: 'Dados incompletos.' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres.' });

    try {
        const tokenHash = hashToken(token);
        const [rows] = await db.query('SELECT * FROM password_reset_tokens WHERE email = ? AND token_hash = ? AND used = 0', [email, tokenHash]);
        const row = rows && rows[0];
        if (!row) return res.status(400).json({ error: 'Token inválido ou já usado.' });
        if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Token expirado.' });

        // localiza usuário por email nas duas tabelas
        const [userRows] = await db.query(`SELECT 'barbeiro' as tipo, id FROM barbeiros WHERE email = ? UNION SELECT 'cliente' as tipo, id FROM clientes WHERE email = ?`, [email, email]);
        if (!userRows || userRows.length === 0) return res.status(400).json({ error: 'Usuário não encontrado.' });

        const user = userRows[0];
        const hashed = await bcrypt.hash(newPassword, 10);
        if (user.tipo === 'barbeiro') {
            await db.query('UPDATE barbeiros SET password_hash = ? WHERE id = ?', [hashed, user.id]);
        } else {
            await db.query('UPDATE clientes SET password_hash = ? WHERE id = ?', [hashed, user.id]);
        }

        // marca token como usado
        await db.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [row.id]);

        return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
        console.error('Erro no reset-password:', err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
});

// Rota: POST /auth/verify-email-document
// Verifica se o documento (CPF/CNPJ) corresponde ao email fornecido
app.post('/auth/verify-email-document', async (req, res) => {
    const { email, documento } = req.body || {};
    if (!email || !documento) return res.status(400).json({ error: 'Email e documento são obrigatórios.' });

    try {
        // Busca documento para barbeiro (perfil_barbeiro) ou cliente (clientes.documento)
        const cleaned = String(documento).replace(/\D/g, '');

        // Primeiro tenta barbeiro + perfil
        const [barberRows] = await db.query(`
            SELECT pb.documento, b.id FROM barbeiros b
            JOIN perfil_barbeiro pb ON b.id = pb.barbeiro_id
            WHERE b.email = ?
        `, [email]);

        if (barberRows && barberRows.length > 0) {
            const stored = String(barberRows[0].documento || '').replace(/\D/g, '');
            if (stored && stored === cleaned) {
                return res.json({ match: true, tipo: 'barbeiro' });
            }
            return res.status(400).json({ error: 'Documento não confere.' });
        }

        // Se não for barbeiro com perfil, tenta cliente
        const [clientRows] = await db.query('SELECT documento, id FROM clientes WHERE email = ?', [email]);
        if (clientRows && clientRows.length > 0) {
            const stored = String(clientRows[0].documento || '').replace(/\D/g, '');
            if (stored && stored === cleaned) {
                return res.json({ match: true, tipo: 'cliente' });
            }
            return res.status(400).json({ error: 'Documento não confere.' });
        }

        return res.status(404).json({ error: 'Usuário não encontrado.' });
    } catch (err) {
        console.error('Erro em verify-email-document:', err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
});

// Rota: POST /auth/reset-password-with-doc
// Recebe { email, documento, newPassword } — verifica documento e atualiza senha
app.post('/auth/reset-password-with-doc', async (req, res) => {
    const { email, documento, newPassword } = req.body || {};
    if (!email || !documento || !newPassword) return res.status(400).json({ error: 'Dados incompletos.' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres.' });

    try {
        const cleaned = String(documento).replace(/\D/g, '');

        // Tenta barbeiro + perfil
        const [barberRows] = await db.query(`
            SELECT pb.documento, b.id FROM barbeiros b
            JOIN perfil_barbeiro pb ON b.id = pb.barbeiro_id
            WHERE b.email = ?
        `, [email]);

        let userType = null;
        let userId = null;

        if (barberRows && barberRows.length > 0) {
            const stored = String(barberRows[0].documento || '').replace(/\D/g, '');
            if (stored !== cleaned) return res.status(400).json({ error: 'Documento não confere.' });
            userType = 'barbeiro';
            userId = barberRows[0].id;
        } else {
            // tenta cliente
            const [clientRows] = await db.query('SELECT documento, id FROM clientes WHERE email = ?', [email]);
            if (clientRows && clientRows.length > 0) {
                const stored = String(clientRows[0].documento || '').replace(/\D/g, '');
                if (stored !== cleaned) return res.status(400).json({ error: 'Documento não confere.' });
                userType = 'cliente';
                userId = clientRows[0].id;
            } else {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        if (userType === 'barbeiro') {
            await db.query('UPDATE barbeiros SET password_hash = ? WHERE id = ?', [hashed, userId]);
        } else {
            await db.query('UPDATE clientes SET password_hash = ? WHERE id = ?', [hashed, userId]);
        }

        return res.json({ message: 'Senha alterada com sucesso.' });

    } catch (err) {
        console.error('Erro em reset-password-with-doc:', err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
});