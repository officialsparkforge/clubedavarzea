-- Adicionar campos de pagamento Asaas à tabela orders
-- MySQL não suporta IF NOT EXISTS com ALTER TABLE ADD COLUMN
-- Se as colunas já existirem, ignore os erros

ALTER TABLE orders ADD COLUMN asaas_customer_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN asaas_payment_id VARCHAR(50);
ALTER TABLE orders ADD COLUMN asaas_invoice_url TEXT;
ALTER TABLE orders ADD COLUMN asaas_bank_slip_url TEXT;
ALTER TABLE orders ADD COLUMN asaas_bank_slip_barcode VARCHAR(100);
ALTER TABLE orders ADD COLUMN asaas_payment_due_date DATE;
ALTER TABLE orders ADD COLUMN pix_qr_code TEXT;
ALTER TABLE orders ADD COLUMN pix_qr_code_image LONGTEXT;

