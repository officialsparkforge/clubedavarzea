-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS clube_varzea;
USE clube_varzea;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  avatar VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Categorias (DEVE VIR ANTES DE TIMES)
CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Times
CREATE TABLE IF NOT EXISTS times (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  categoria_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  time_id VARCHAR(36),
  categoria_id VARCHAR(50),
  season VARCHAR(20),
  versao VARCHAR(50),
  preco DECIMAL(10, 2) NOT NULL,
  preco_original DECIMAL(10, 2),
  image_url LONGTEXT,
  tamanhos JSON,
  descricao LONGTEXT,
  composicao VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  estoque INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE SET NULL,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabela de Cupons
CREATE TABLE IF NOT EXISTS cupons (
  id VARCHAR(36) PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  desconto_percentual DECIMAL(5, 2),
  desconto_fixo DECIMAL(10, 2),
  compra_minima DECIMAL(10, 2) DEFAULT 0,
  max_usos INT DEFAULT -1,
  usos_atuais INT DEFAULT 0,
  valido_de DATETIME,
  valido_ate DATETIME,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id VARCHAR(36) PRIMARY KEY,
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  status ENUM('confirmado', 'separacao', 'enviado', 'saiu_entrega', 'entregue', 'cancelado') DEFAULT 'confirmado',
  total DECIMAL(10, 2) NOT NULL,
  items JSON,
  endereco_entrega JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario (usuario_id),
  INDEX idx_status (status)
);

-- Inserir admin padrão (ignore se já existir)
INSERT IGNORE INTO usuarios (id, email, senha, nome, role, avatar) 
VALUES ('admin-001', 'admin@clubevarzea.com', 'admin123', 'Administrador Master', 'admin', '👨‍💼');

-- Inserir categorias padrão (ignore se já existirem)
INSERT IGNORE INTO categorias (id, label) VALUES 
('brasileirao', 'Brasileirão'),
('europeus', 'Europeus'),
('selecoes', 'Seleções'),
('raros', 'Raros'),
('personalizadas', 'Personalizadas');

-- Inserir times padrão (ignore se já existirem)
INSERT IGNORE INTO times (id, nome, categoria_id) VALUES 
(UUID(), 'Flamengo', 'brasileirao'),
(UUID(), 'Corinthians', 'brasileirao'),
(UUID(), 'Palmeiras', 'brasileirao'),
(UUID(), 'São Paulo', 'brasileirao'),
(UUID(), 'Santos', 'brasileirao'),
(UUID(), 'Real Madrid', 'europeus'),
(UUID(), 'Barcelona', 'europeus'),
(UUID(), 'Manchester United', 'europeus'),
(UUID(), 'Bayern Munich', 'europeus'),
(UUID(), 'Brasil', 'selecoes'),
(UUID(), 'Argentina', 'selecoes'),
(UUID(), 'Portugal', 'selecoes'),
(UUID(), 'França', 'selecoes');

