const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function runMigration() {
    const db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true  // Necessário para executar múltiplas queries
    });

    try {
        console.log('Conectando ao banco de dados...');
        const connection = await db.getConnection();
        console.log('Conexão estabelecida!');

        const migrationFile = path.join(__dirname, 'migrations', '20251204_add_unique_documento_telefone.sql');
        console.log(`Lendo migration: ${migrationFile}`);
        
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        console.log('Executando migration...');
        await connection.query(sql);
        
        console.log('✓ Migration executada com sucesso!');
        console.log('✓ Constraints UNIQUE adicionadas para documento (CPF/CNPJ)');
        console.log('✓ Agora não será possível criar contas com CPF/CNPJ duplicados');
        
        connection.release();
        await db.end();
        
    } catch (error) {
        console.error('Erro ao executar migration:', error.message);
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠ A constraint UNIQUE já existe no banco de dados.');
        } else if (error.code === 'ER_DUP_ENTRY') {
            console.error('⚠ ERRO: Existem documentos duplicados no banco!');
            console.error('   Execute a migration manualmente para remover duplicatas primeiro.');
        }
        process.exit(1);
    }
}

runMigration();
