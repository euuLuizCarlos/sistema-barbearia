-- Migração: Criar tabela de maquininhas e migrar dados existentes
-- Data: 04/12/2025

-- 1. Criar tabela de maquininhas
CREATE TABLE IF NOT EXISTS maquininhas (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    barbeiro_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    taxa DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
    ativa BOOLEAN DEFAULT TRUE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE CASCADE,
    INDEX idx_barbeiro (barbeiro_id)
);

-- 2. Migrar dados existentes da tabela taxa_cartao para maquininhas
-- (Criar uma maquininha padrão para cada barbeiro que já tem taxa configurada)
-- APENAS os barbeiros que existem em barbeiros table
INSERT INTO maquininhas (barbeiro_id, nome, taxa, ativa)
SELECT tc.barbeiro_id, 'Maquininha Principal', tc.taxa, TRUE
FROM taxa_cartao tc
INNER JOIN barbeiros b ON tc.barbeiro_id = b.id
WHERE tc.taxa > 0
ON DUPLICATE KEY UPDATE ativa = ativa; -- Evita duplicatas se rodar script 2x

-- 3. Adicionar coluna maquininha_id nas tabelas relacionadas (opcional por enquanto)
-- ALTER TABLE movimentacoes_financeiras ADD COLUMN maquininha_id INT NULL;
-- ALTER TABLE movimentacoes_financeiras ADD FOREIGN KEY (maquininha_id) REFERENCES maquininhas(id) ON DELETE SET NULL;

-- Nota: A tabela taxa_cartao será mantida por compatibilidade, mas não será mais usada
-- em novas implementações. Futuramente pode ser removida.
