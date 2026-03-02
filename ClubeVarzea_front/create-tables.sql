-- Criar tabela orders (usada pela aplicação)
USE clube_varzea;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('confirmado', 'separacao', 'enviado', 'saiu_entrega', 'entregue', 'cancelado') DEFAULT 'confirmado',
  payment_status ENUM('pendente', 'pago', 'cancelado', 'expirado') DEFAULT 'pendente',
  payment_method VARCHAR(50),
  shipping_method VARCHAR(50),
  tracking_code VARCHAR(100),
  estimated_delivery DATE,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  wallet_discount DECIMAL(10, 2) DEFAULT 0,
  wallet_id VARCHAR(36),
  total DECIMAL(10, 2) NOT NULL,
  coupon_code VARCHAR(50),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_document VARCHAR(50),
  items JSON,
  shipping_address JSON,
  asaas_customer_id VARCHAR(50),
  asaas_payment_id VARCHAR(50),
  asaas_invoice_url TEXT,
  asaas_bank_slip_url TEXT,
  asaas_bank_slip_barcode VARCHAR(100),
  asaas_payment_due_date DATE,
  pix_qr_code TEXT,
  pix_qr_code_image LONGTEXT,
  referral_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_asaas_payment (asaas_payment_id)
);

-- Criar outras tabelas necessárias

CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  product_id VARCHAR(36),
  nome VARCHAR(255),
  time VARCHAR(100),
  tamanho VARCHAR(10),
  quantidade INT DEFAULT 1,
  preco DECIMAL(10, 2),
  imagem_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by)
);

CREATE TABLE IF NOT EXISTS favorites (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  product_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_product (product_id),
  UNIQUE KEY unique_favorite (created_by, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  product_id VARCHAR(36),
  rating INT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product (product_id)
);

CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE,
  referred_users JSON,
  referred_orders JSON,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  total_points INT DEFAULT 0,
  level INT DEFAULT 1,
  level_name VARCHAR(50) DEFAULT 'Bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_referral_code (referral_code)
);

CREATE TABLE IF NOT EXISTS wallets (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  balance DECIMAL(10, 2) DEFAULT 0,
  transactions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by)
);

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5, 2),
  discount_fixed DECIMAL(10, 2),
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INT DEFAULT -1,
  current_uses INT DEFAULT 0,
  valid_from DATETIME,
  valid_until DATETIME,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (active)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  created_by VARCHAR(255),
  plan VARCHAR(50),
  status VARCHAR(50),
  start_date DATE,
  next_billing_date DATE,
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by)
);

