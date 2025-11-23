-- Migration: criar tabela blocked_dates para armazenar feriados e dias não trabalháveis por barbeiro

CREATE TABLE IF NOT EXISTS blocked_dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barbeiro_id INT NOT NULL,
    `date` DATE NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_barbeiro_date (barbeiro_id, `date`),
    INDEX idx_barbeiro (barbeiro_id)
);

-- Observação: aplique esta migration no banco (mysql) antes de testar as rotas.
