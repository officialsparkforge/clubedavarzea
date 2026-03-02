-- Versão simples: adicionar campos de carteira na tabela orders
-- Se as colunas já existirem, você verá um erro mas pode ignorá-lo
USE clube_varzea;

ALTER TABLE orders ADD COLUMN wallet_discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN wallet_id VARCHAR(36) DEFAULT NULL;

