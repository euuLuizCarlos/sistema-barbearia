-- Migração: Adicionar constraints UNIQUE para documento (CPF/CNPJ) e telefone
-- Data: 04/12/2025
-- Objetivo: Garantir que CPF/CNPJ sejam únicos no sistema

-- 1. Verificar e remover documentos duplicados existentes (se houver)
-- Manter apenas o registro mais antigo em caso de duplicatas
DELETE t1 FROM perfil_barbeiro t1
INNER JOIN perfil_barbeiro t2 
WHERE t1.barbeiro_id > t2.barbeiro_id 
AND t1.documento = t2.documento 
AND t1.documento IS NOT NULL;

-- Fazer o mesmo para clientes
DELETE t1 FROM clientes t1
INNER JOIN clientes t2 
WHERE t1.id > t2.id 
AND t1.documento = t2.documento 
AND t1.documento IS NOT NULL;

-- 2. Adicionar constraint UNIQUE para documento na tabela perfil_barbeiro
ALTER TABLE perfil_barbeiro 
ADD UNIQUE KEY unique_documento (documento);

-- 3. Adicionar constraint UNIQUE para documento na tabela clientes
ALTER TABLE clientes 
ADD UNIQUE KEY unique_documento (documento);

-- 4. Adicionar constraint UNIQUE para telefone na tabela perfil_barbeiro (opcional)
-- Descomente a linha abaixo se quiser que telefone também seja único
-- ALTER TABLE perfil_barbeiro ADD UNIQUE KEY unique_telefone (telefone);

-- Nota: Esta migration garante que não existirão CPF ou CNPJ duplicados no sistema