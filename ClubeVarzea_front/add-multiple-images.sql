-- Script para adicionar suporte a múltiplas imagens nos produtos
-- Execute este script no seu banco de dados MySQL

-- Adicionar nova coluna para múltiplas imagens (JSON)
ALTER TABLE produtos ADD COLUMN images JSON DEFAULT NULL AFTER image_url;

-- Migrar imagem existente para o novo formato
UPDATE produtos 
SET images = JSON_ARRAY(image_url) 
WHERE image_url IS NOT NULL AND image_url != '';

-- Opcional: Após verificar que a migração funcionou, você pode remover a coluna antiga
-- ALTER TABLE produtos DROP COLUMN image_url;

-- Verificar a estrutura atualizada
DESCRIBE produtos;

-- Ver alguns registros de exemplo
SELECT id, nome, image_url, images FROM produtos LIMIT 5;
