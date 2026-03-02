const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

(async () => {
  const { v4: uuidv4 } = await import('uuid');
  const { Resend } = await import('resend');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb' }));

  // Initialize Resend (optional)
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Initialize Asaas API
  const asaasAPI = axios.create({
    baseURL: process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3',
    headers: {
      'access_token': process.env.ASAAS_API_KEY,
      'Content-Type': 'application/json',
    },
});

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    return fallback;
  }
};

const getUserEmail = (req) => req.get('X-User-Email') || null;
const getAnonymousId = (req) => req.get('X-Anonymous-Id') || null;

// Obter identificador do usuário (email se logado, ID anônimo caso contrário)
const getUserIdentifier = (req) => {
  const userEmail = getUserEmail(req);
  if (userEmail) return userEmail;
  return getAnonymousId(req) || null;
};

// Pool de conexoes MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'clube_varzea',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// =============== PRODUTOS ===============

// GET - Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [produtos] = await connection.query(`
      SELECT p.*, t.nome as team, c.label as categoria
      FROM produtos p
      LEFT JOIN times t ON p.time_id = t.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.created_at DESC
    `);
    connection.release();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const {
      nome,
      team,
      time,
      category,
      season,
      temporada,
      version,
      price,
      original_price,
      image_url,
      imagem_url,
      images,
      sizes,
      description,
      composition,
      is_featured,
      destaque,
      is_new,
      novo,
      stock,
      categoria_id,
      versao,
      preco,
      preco_original,
      tamanhos,
      descricao,
      composicao,
      estoque,
    } = req.body;
    
    const resolvedTeam = team || time;
    const resolvedCategory = categoria_id || category || null;
    const resolvedSeason = season || temporada || null;
    const resolvedVersion = versao || version || null;
    const resolvedPrice = price ?? preco;
    const resolvedOriginalPrice = original_price ?? preco_original ?? null;
    const resolvedSizes = sizes ?? tamanhos ?? [];
    const resolvedDescription = description || descricao || null;
    const resolvedComposition = composition || composicao || null;
    const resolvedStock = stock ?? estoque ?? 0;
    const resolvedFeatured = is_featured ?? destaque ?? false;
    const resolvedNew = is_new ?? novo ?? false;
    
    // Handle multiple images
    let resolvedImages = images || [];
    let resolvedImageUrl = image_url || imagem_url;
    
    // If images array is provided, use first image as image_url for backwards compatibility
    if (Array.isArray(resolvedImages) && resolvedImages.length > 0) {
      resolvedImageUrl = resolvedImages[0];
    } else if (resolvedImageUrl) {
      // If only image_url is provided, create images array with single image
      resolvedImages = [resolvedImageUrl];
    }

    if (!nome || resolvedPrice === undefined || resolvedPrice === null) {
      return res.status(400).json({ error: 'Nome e preco sao obrigatorios' });
    }

    const connection = await pool.getConnection();
    
    // Encontrar time_id pelo nome
    let time_id = null;
    if (resolvedTeam) {
      const [times] = await connection.query('SELECT id FROM times WHERE nome = ?', [resolvedTeam]);
      if (times.length > 0) {
        time_id = times[0].id;
      } else {
        // Criar novo time se nao existir
        time_id = uuidv4();
        await connection.query('INSERT INTO times (id, nome) VALUES (?, ?)', [time_id, resolvedTeam]);
      }
    }

    const id = uuidv4();
    await connection.query(
      `INSERT INTO produtos (id, nome, time_id, categoria_id, season, versao, preco, preco_original, image_url, images, tamanhos, descricao, composicao, is_featured, is_new, estoque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nome,
        time_id,
        resolvedCategory,
        resolvedSeason,
        resolvedVersion,
        resolvedPrice,
        resolvedOriginalPrice,
        resolvedImageUrl || null,
        JSON.stringify(resolvedImages),
        JSON.stringify(resolvedSizes),
        resolvedDescription,
        resolvedComposition,
        resolvedFeatured ? 1 : 0,
        resolvedNew ? 1 : 0,
        resolvedStock,
      ]
    );

    connection.release();
    res.json({ id, message: 'Produto criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      team,
      time,
      category,
      season,
      temporada,
      version,
      price,
      original_price,
      image_url,
      imagem_url,
      images,
      sizes,
      description,
      composition,
      is_featured,
      destaque,
      is_new,
      novo,
      stock,
      categoria_id,
      versao,
      preco,
      preco_original,
      tamanhos,
      descricao,
      composicao,
      estoque,
    } = req.body;

    const resolvedTeam = team || time;
    const resolvedCategory = categoria_id || category || null;
    const resolvedSeason = season || temporada || null;
    const resolvedVersion = versao || version || null;
    const resolvedPrice = price ?? preco;
    const resolvedOriginalPrice = original_price ?? preco_original ?? null;
    const resolvedSizes = sizes ?? tamanhos ?? [];
    const resolvedDescription = description || descricao || null;
    const resolvedComposition = composition || composicao || null;
    const resolvedStock = stock ?? estoque ?? 0;
    const resolvedFeatured = is_featured ?? destaque ?? false;
    const resolvedNew = is_new ?? novo ?? false;
    
    // Handle multiple images
    let resolvedImages = images || [];
    let resolvedImageUrl = image_url || imagem_url;
    
    // If images array is provided, use first image as image_url for backwards compatibility
    if (Array.isArray(resolvedImages) && resolvedImages.length > 0) {
      resolvedImageUrl = resolvedImages[0];
    } else if (resolvedImageUrl) {
      // If only image_url is provided, create images array with single image
      resolvedImages = [resolvedImageUrl];
    }

    const connection = await pool.getConnection();

    let time_id = null;
    if (resolvedTeam) {
      const [times] = await connection.query('SELECT id FROM times WHERE nome = ?', [resolvedTeam]);
      if (times.length > 0) {
        time_id = times[0].id;
      } else {
        time_id = uuidv4();
        await connection.query('INSERT INTO times (id, nome) VALUES (?, ?)', [time_id, resolvedTeam]);
      }
    }

    await connection.query(
      `UPDATE produtos 
       SET nome=?, time_id=?, categoria_id=?, season=?, versao=?, preco=?, preco_original=?, image_url=?, images=?, tamanhos=?, descricao=?, composicao=?, is_featured=?, is_new=?, estoque=?, updated_at=NOW()
       WHERE id=?`,
      [
        nome,
        time_id,
        resolvedCategory,
        resolvedSeason,
        resolvedVersion,
        resolvedPrice,
        resolvedOriginalPrice,
        resolvedImageUrl || null,
        JSON.stringify(resolvedImages),
        JSON.stringify(resolvedSizes),
        resolvedDescription,
        resolvedComposition,
        resolvedFeatured ? 1 : 0,
        resolvedNew ? 1 : 0,
        resolvedStock,
        id,
      ]
    );

    connection.release();
    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM produtos WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Atualizar preço de custo do produto
app.put('/api/produtos/:id/custo', async (req, res) => {
  try {
    const { id } = req.params;
    const { preco_custo } = req.body;
    
    if (preco_custo === undefined || preco_custo === null) {
      return res.status(400).json({ error: 'Preço de custo é obrigatório' });
    }
    
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE produtos SET preco_custo = ?, updated_at = NOW() WHERE id = ?',
      [preco_custo, id]
    );
    connection.release();
    res.json({ message: 'Preço de custo atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Histórico de custos de um produto
app.get('/api/produtos/:id/custos-historico', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [costos] = await connection.query(
      'SELECT id, produto_id, data, custo, venda, created_at, updated_at FROM produtos_custos_historico WHERE produto_id = ? ORDER BY data DESC',
      [id]
    );
    
    connection.release();
    res.json(costos || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Adicionar entrada de custo
app.post('/api/produtos/:id/custos-historico', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, custo, venda } = req.body;
    
    if (!data || custo === undefined || custo === null) {
      return res.status(400).json({ error: 'Data e custo são obrigatórios' });
    }
    
    const connection = await pool.getConnection();
    const entryId = uuidv4();
    
    await connection.query(
      'INSERT INTO produtos_custos_historico (id, produto_id, data, custo, venda) VALUES (?, ?, ?, ?, ?)',
      [entryId, id, data, parseFloat(custo), venda ? parseFloat(venda) : null]
    );
    
    const [newEntry] = await connection.query(
      'SELECT id, produto_id, data, custo, venda, created_at FROM produtos_custos_historico WHERE id = ?',
      [entryId]
    );
    
    connection.release();
    res.json(newEntry[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Remover entrada de custo
app.delete('/api/produtos/:id/custos-historico/:entryId', async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query(
      'DELETE FROM produtos_custos_historico WHERE id = ? AND produto_id = ?',
      [entryId, id]
    );
    
    connection.release();
    res.json({ message: 'Entrada removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Relatório de lucros (vendas realizadas)
app.get('/api/relatorio/lucros', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Buscar todos os pedidos com seus itens e referral code
    const [orders] = await connection.query(`
      SELECT id, order_number, items, total, created_at, status, referral_code
      FROM orders
      WHERE status IN ('confirmado', 'separacao', 'enviado', 'saiu_entrega', 'entregue')
      ORDER BY created_at DESC
    `);
    
    console.log(`📦 Total de pedidos encontrados: ${orders.length}`);
    
    // Buscar todos os produtos com seus custos
    const [products] = await connection.query(`
      SELECT p.id, p.nome, p.preco, p.preco_custo, t.nome as team
      FROM produtos p
      LEFT JOIN times t ON p.time_id = t.id
    `);
    
    console.log(`📊 Total de produtos encontrados: ${products.length}`);
    
    // Buscar todos os referrals com seus pedidos
    const [referrals] = await connection.query(`
      SELECT id, created_by, referral_code, level, referred_orders
      FROM referrals
    `);
    
    console.log(`👥 Total de referrals encontrados: ${referrals.length}`);
    
    connection.release();
    
    // Criar mapa de produtos para lookup rápido
    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = {
        nome: p.nome,
        team: p.team,
        preco_venda: parseFloat(p.preco),
        preco_custo: parseFloat(p.preco_custo || 0),
      };
    });
    
    // Criar mapa de comissões por pedido
    const commissionsMap = {};
    referrals.forEach(ref => {
      let refOrders = [];
      try {
        refOrders = typeof ref.referred_orders === 'string' 
          ? JSON.parse(ref.referred_orders) 
          : (ref.referred_orders || []);
      } catch (e) {
        refOrders = [];
      }
      
      refOrders.forEach(refOrder => {
        if (refOrder.order_id) {
          commissionsMap[refOrder.order_id] = {
            referral_code: ref.referral_code,
            referrer: ref.created_by,
            commission_amount: parseFloat(refOrder.commission_amount || 0),
            level: ref.level || 1,
          };
        }
      });
    });
    
    // Processar cada pedido e calcular lucros
    const salesData = [];
    let totalCusto = 0;
    let totalVenda = 0;
    let totalLucro = 0;
    let totalComissoes = 0;
    
    orders.forEach(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        items = [];
      }
      
      const orderCommission = commissionsMap[order.id];
      const comissaoValor = orderCommission ? orderCommission.commission_amount : 0;
      
      items.forEach(item => {
        const product = productMap[item.product_id];
        if (product) {
          const quantidade = item.quantity || 1;
          const precoVenda = parseFloat(item.price || product.preco_venda);
          const precoCusto = product.preco_custo;
          
          const custoTotal = precoCusto * quantidade;
          const vendaTotal = precoVenda * quantidade;
          const lucroSemComissao = vendaTotal - custoTotal;
          const margemLucro = vendaTotal > 0 ? ((lucroSemComissao / vendaTotal) * 100) : 0;
          
          totalCusto += custoTotal;
          totalVenda += vendaTotal;
          totalLucro += lucroSemComissao;
          
          salesData.push({
            order_id: order.id,
            order_number: order.order_number,
            product_id: item.product_id,
            product_name: product.nome,
            team: product.team,
            size: item.size,
            quantidade: quantidade,
            preco_custo: precoCusto,
            preco_venda: precoVenda,
            custo_total: custoTotal,
            venda_total: vendaTotal,
            lucro: lucroSemComissao,
            margem_lucro: margemLucro,
            data_venda: order.created_at,
            status: order.status,
            referral_code: orderCommission ? orderCommission.referral_code : null,
            comissao: comissaoValor,
            referrer: orderCommission ? orderCommission.referrer : null,
          });
        }
      });
      
      if (comissaoValor > 0) {
        totalComissoes += comissaoValor;
      }
    });
    
    const lucroLiquido = totalLucro - totalComissoes;
    
    console.log(`✅ Processadas ${salesData.length} vendas | Lucro bruto: R$ ${totalLucro.toFixed(2)} | Comissões: R$ ${totalComissoes.toFixed(2)} | Lucro líquido: R$ ${lucroLiquido.toFixed(2)}`);
    
    res.json({
      vendas: salesData,
      resumo: {
        total_custo: totalCusto,
        total_venda: totalVenda,
        total_lucro_bruto: totalLucro,
        total_comissoes: totalComissoes,
        total_lucro_liquido: lucroLiquido,
        margem_lucro_media: totalVenda > 0 ? ((lucroLiquido / totalVenda) * 100) : 0,
        total_vendas: salesData.length,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============== CUPONS ===============

// GET - Listar cupons
app.get('/api/cupons', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [cupons] = await connection.query('SELECT * FROM cupons ORDER BY created_at DESC');
    connection.release();
    res.json(cupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar cupom
app.post('/api/cupons', async (req, res) => {
  try {
    const {
      code,
      discount_percent,
      discount_fixed,
      min_purchase,
      max_uses,
      valid_from,
      valid_until,
      active,
      codigo,
      desconto_percentual,
      desconto_fixo,
      compra_minima,
      max_usos,
      valido_de,
      valido_ate,
      ativo,
    } = req.body;

    let resolvedCode = codigo || code;
    const resolvedPercent = discount_percent ?? desconto_percentual ?? null;
    const resolvedFixed = discount_fixed ?? desconto_fixo ?? null;
    const resolvedMin = min_purchase ?? compra_minima ?? 0;
    const resolvedMax = max_uses ?? max_usos ?? -1;
    const resolvedFrom = valid_from ?? valido_de ?? null;
    const resolvedUntil = valid_until ?? valido_ate ?? null;
    const resolvedActive = active ?? ativo ?? true;
    
    if (!resolvedCode) {
      return res.status(400).json({ error: 'Codigo e obrigatorio' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    
    await connection.query(
      `INSERT INTO cupons (id, codigo, desconto_percentual, desconto_fixo, compra_minima, max_usos, valido_de, valido_ate, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        resolvedCode,
        resolvedPercent,
        resolvedFixed,
        resolvedMin,
        resolvedMax,
        resolvedFrom,
        resolvedUntil,
        resolvedActive ? 1 : 0,
      ]
    );

    connection.release();
    res.json({ id, message: 'Cupom criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Atualizar cupom
app.put('/api/cupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_percent,
      discount_fixed,
      min_purchase,
      max_uses,
      valid_from,
      valid_until,
      active,
      codigo,
      desconto_percentual,
      desconto_fixo,
      compra_minima,
      max_usos,
      valido_de,
      valido_ate,
      ativo,
    } = req.body;

    let resolvedCode = codigo || code;
    const resolvedPercent = discount_percent ?? desconto_percentual ?? null;
    const resolvedFixed = discount_fixed ?? desconto_fixo ?? null;
    const resolvedMin = min_purchase ?? compra_minima ?? 0;
    const resolvedMax = max_uses ?? max_usos ?? -1;
    const resolvedFrom = valid_from ?? valido_de ?? null;
    const resolvedUntil = valid_until ?? valido_ate ?? null;
    const connection = await pool.getConnection();
    if (!resolvedCode) {
      const [existingRows] = await connection.query('SELECT codigo FROM cupons WHERE id = ?', [id]);
      resolvedCode = existingRows.length > 0 ? existingRows[0].codigo : null;
    }

    let resolvedActive = active ?? ativo;
    if (resolvedActive === undefined || resolvedActive === null) {
      const [existingRows] = await connection.query('SELECT ativo FROM cupons WHERE id = ?', [id]);
      const currentActive = existingRows.length > 0 ? existingRows[0].ativo : 1;
      resolvedActive = currentActive;
    }

    if (!resolvedCode) {
      connection.release();
      return res.status(400).json({ error: 'Código é obrigatório' });
    }
    await connection.query(
      `UPDATE cupons 
       SET codigo=?, desconto_percentual=?, desconto_fixo=?, compra_minima=?, max_usos=?, valido_de=?, valido_ate=?, ativo=?, updated_at=NOW()
       WHERE id=?`,
      [
        resolvedCode,
        resolvedPercent,
        resolvedFixed,
        resolvedMin,
        resolvedMax,
        resolvedFrom,
        resolvedUntil,
        resolvedActive ? 1 : 0,
        id,
      ]
    );

    connection.release();
    res.json({ message: 'Cupom atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Deletar cupom
app.delete('/api/cupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM cupons WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Cupom deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== TIMES ===============

// GET - Listar times
app.get('/api/times', async (req, res) => {
  try {
    const { categoria_id } = req.query;
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (categoria_id) {
      filters.push('t.categoria_id = ?');
      params.push(categoria_id);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [times] = await connection.query(
      `SELECT t.id, t.nome, t.categoria_id, c.label AS categoria_label
       FROM times t
       LEFT JOIN categorias c ON t.categoria_id = c.id
       ${whereClause}
       ORDER BY t.nome`,
      params
    );
    connection.release();
    res.json(times);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar time
app.post('/api/times', async (req, res) => {
  try {
    const { nome, categoria_id } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome e obrigatorio' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    
    await connection.query('INSERT INTO times (id, nome, categoria_id) VALUES (?, ?, ?)', [id, nome, categoria_id || null]);
    connection.release();
    res.json({ id, message: 'Time criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Deletar time
app.delete('/api/times/:nome', async (req, res) => {
  try {
    const { nome } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM times WHERE nome = ?', [nome]);
    connection.release();
    res.json({ message: 'Time deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== CATEGORIAS ===============

// GET - Listar categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [categorias] = await connection.query('SELECT * FROM categorias ORDER BY label');
    connection.release();
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar categoria
app.post('/api/categorias', async (req, res) => {
  try {
    const { id, label } = req.body;
    
    if (!id || !label) {
      return res.status(400).json({ error: 'ID e label sao obrigatorios' });
    }

    const connection = await pool.getConnection();
    await connection.query('INSERT INTO categorias (id, label) VALUES (?, ?)', [id, label]);
    connection.release();
    res.json({ message: 'Categoria criada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Deletar categoria
app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM categorias WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== PEDIDOS ===============

// GET - Listar pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [pedidos] = await connection.query('SELECT * FROM pedidos ORDER BY created_at DESC');
    connection.release();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Listar pedidos por usuario
app.get('/api/pedidos/usuario/:usuario_id', async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const connection = await pool.getConnection();
    const [pedidos] = await connection.query('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY created_at DESC', [usuario_id]);
    connection.release();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { usuario_id, items, total, endereco_entrega } = req.body;

    const connection = await pool.getConnection();
    const id = uuidv4();
    const numero_pedido = 'CDVMK' + Date.now().toString().slice(-8);
    
    await connection.query(
      `INSERT INTO pedidos (id, numero_pedido, usuario_id, status, total, items, endereco_entrega)
       VALUES (?, ?, ?, 'confirmado', ?, ?, ?)`,
      [id, numero_pedido, usuario_id, total, JSON.stringify(items), JSON.stringify(endereco_entrega)]
    );

    connection.release();
    res.json({ id, numero_pedido, message: 'Pedido criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Atualizar status do pedido
app.put('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const connection = await pool.getConnection();
    await connection.query('UPDATE pedidos SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    connection.release();
    res.json({ message: 'Pedido atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== STORE PRODUCTS (BASE44) ===============

app.get('/api/products', async (req, res) => {
  try {
    const { category, team, is_featured, is_new, id, limit } = req.query;
    const connection = await pool.getConnection();

    const filters = [];
    const params = [];

    if (id) {
      filters.push('p.id = ?');
      params.push(id);
    }

    if (category && category !== 'all') {
      filters.push('p.categoria_id = ?');
      params.push(category);
    }

    if (team) {
      filters.push('t.nome = ?');
      params.push(team);
    }

    if (is_featured !== undefined) {
      filters.push('p.is_featured = ?');
      params.push(is_featured === 'true' ? 1 : 0);
    }

    if (is_new !== undefined) {
      filters.push('p.is_new = ?');
      params.push(is_new === 'true' ? 1 : 0);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const limitClause = limit ? 'LIMIT ?' : '';
    if (limit) params.push(parseInt(limit));

    const [rows] = await connection.query(
      `SELECT p.id, p.nome, p.season, p.versao, p.preco, p.preco_original, p.image_url, p.images, p.tamanhos,
              p.descricao, p.composicao, p.is_featured, p.is_new, p.estoque, p.created_at,
              t.nome AS team, p.categoria_id AS category
       FROM produtos p
       LEFT JOIN times t ON p.time_id = t.id
       ${whereClause}
       ORDER BY p.created_at DESC
       ${limitClause}`,
      params
    );
    connection.release();

    const products = rows.map((row) => ({
      id: row.id,
      name: row.nome,
      team: row.team || '',
      category: row.category,
      season: row.season,
      version: row.versao,
      price: Number(row.preco),
      original_price: row.preco_original !== null ? Number(row.preco_original) : null,
      image_url: row.image_url,
      images: parseJson(row.images, [row.image_url].filter(Boolean)),
      sizes: parseJson(row.tamanhos, ['P', 'M', 'G', 'GG']),
      description: row.descricao,
      composition: row.composicao,
      is_featured: Boolean(row.is_featured),
      is_new: Boolean(row.is_new),
      stock: row.estoque,
      created_date: row.created_at,
    }));

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT p.id, p.nome, p.season, p.versao, p.preco, p.preco_original, p.image_url, p.images, p.tamanhos,
              p.descricao, p.composicao, p.is_featured, p.is_new, p.estoque, p.created_at,
              t.nome AS team, p.categoria_id AS category
       FROM produtos p
       LEFT JOIN times t ON p.time_id = t.id
       WHERE p.id = ?`,
      [id]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto nao encontrado' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      name: row.nome,
      team: row.team || '',
      category: row.category,
      season: row.season,
      version: row.versao,
      price: Number(row.preco),
      original_price: row.preco_original !== null ? Number(row.preco_original) : null,
      image_url: row.image_url,
      images: parseJson(row.images, [row.image_url].filter(Boolean)),
      sizes: parseJson(row.tamanhos, ['P', 'M', 'G', 'GG']),
      description: row.descricao,
      composition: row.composicao,
      is_featured: Boolean(row.is_featured),
      is_new: Boolean(row.is_new),
      stock: row.estoque,
      created_date: row.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== STORE COUPONS (BASE44) ===============

app.get('/api/coupons', async (req, res) => {
  try {
    const { active } = req.query;
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (active !== undefined) {
      filters.push('ativo = ?');
      params.push(active === 'true' ? 1 : 0);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM cupons ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();

    const coupons = rows.map((row) => ({
      id: row.id,
      code: row.codigo,
      discount_percent: row.desconto_percentual !== null ? Number(row.desconto_percentual) : null,
      discount_fixed: row.desconto_fixo !== null ? Number(row.desconto_fixo) : null,
      min_purchase: row.compra_minima !== null ? Number(row.compra_minima) : 0,
      max_uses: row.max_usos,
      current_uses: row.usos_atuais || 0,
      valid_from: row.valido_de,
      valid_until: row.valido_ate,
      active: Boolean(row.ativo),
      created_date: row.created_at,
    }));

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== CART ITEMS ===============

app.get('/api/cart-items', async (req, res) => {
  try {
    const { product_id, size } = req.query;
    const createdBy = getUserIdentifier(req);
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    if (product_id) {
      filters.push('product_id = ?');
      params.push(product_id);
    }

    if (size) {
      filters.push('size = ?');
      params.push(size);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM cart_items ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cart-items', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserIdentifier(req);
    const { product_id, name, team, size, quantity, price, image_url } = req.body;

    if (!createdBy || !product_id || !name || !price) {
      return res.status(400).json({ error: 'Dados obrigatorios ausentes' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO cart_items (id, created_by, product_id, name, team, size, quantity, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, createdBy, product_id, name, team || null, size || null, quantity || 1, price, image_url || null]
    );
    connection.release();
    res.json({ id, message: 'Item adicionado ao carrinho' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cart-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?',
      [quantity, id]
    );
    connection.release();
    res.json({ message: 'Item atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cart-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM cart_items WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== FAVORITES ===============

app.get('/api/favorites', async (req, res) => {
  try {
    const { product_id } = req.query;
    const createdBy = getUserIdentifier(req);
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    if (product_id) {
      filters.push('product_id = ?');
      params.push(product_id);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM favorites ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/favorites', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserIdentifier(req);
    const { product_id } = req.body;

    if (!createdBy || !product_id) {
      return res.status(400).json({ error: 'Dados obrigatorios ausentes' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT IGNORE INTO favorites (id, created_by, product_id) VALUES (?, ?, ?)`,
      [id, createdBy, product_id]
    );
    connection.release();
    res.json({ id, message: 'Favorito adicionado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM favorites WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Favorito removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== REVIEWS ===============

app.get('/api/reviews', async (req, res) => {
  try {
    const { product_id } = req.query;
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (product_id) {
      filters.push('product_id = ?');
      params.push(product_id);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM reviews ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();

    const reviews = rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      rating: row.rating,
      comment: row.comment,
      user_name: row.user_name,
      created_date: row.created_at,
    }));

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserEmail(req);
    const { product_id, rating, comment, user_name } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Produto e nota sao obrigatorios' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO reviews (id, product_id, rating, comment, user_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, product_id, rating, comment || null, user_name || null, createdBy]
    );
    connection.release();
    res.json({ id, message: 'Avaliacao criada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== REFERRALS ===============

app.get('/api/referrals', async (req, res) => {
  try {
    const { referral_code } = req.query;
    const createdBy = getUserEmail(req);
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    if (referral_code) {
      filters.push('referral_code = ?');
      params.push(referral_code);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM referrals ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();

    const referrals = rows.map((row) => ({
      id: row.id,
      created_by: row.created_by,
      referral_code: row.referral_code,
      total_sales: Number(row.total_sales || 0),
      total_points: row.total_points || 0,
      level: row.level || 1,
      level_name: row.level_name || 'Bronze',
      referred_orders: parseJson(row.referred_orders, []),
      created_date: row.created_at,
    }));

    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/referrals', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserEmail(req);
    const { referral_code, total_sales, total_points, level, level_name, referred_orders } = req.body;

    if (!createdBy || !referral_code) {
      return res.status(400).json({ error: 'Dados obrigatorios ausentes' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO referrals (id, created_by, referral_code, total_sales, total_points, level, level_name, referred_orders)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, createdBy, referral_code, total_sales || 0, total_points || 0, level || 1, level_name || 'Bronze', JSON.stringify(referred_orders || [])]
    );
    connection.release();
    res.json({ id, message: 'Referral criado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/referrals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total_sales, total_points, level, level_name, referred_orders } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE referrals SET total_sales = ?, total_points = ?, level = ?, level_name = ?, referred_orders = ?, updated_at = NOW() WHERE id = ?`,
      [total_sales || 0, total_points || 0, level || 1, level_name || 'Bronze', JSON.stringify(referred_orders || []), id]
    );
    connection.release();
    res.json({ message: 'Referral atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== SUBSCRIPTIONS ===============

app.get('/api/subscriptions', async (req, res) => {
  try {
    const createdBy = getUserEmail(req);
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM subscriptions ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();

    const subscriptions = rows.map((row) => ({
      id: row.id,
      created_by: row.created_by,
      plan_type: row.plan_type,
      status: row.status,
      price: Number(row.price || 0),
      frequency: row.frequency,
      next_delivery_date: row.next_delivery_date,
      boxes_received: row.boxes_received || 0,
      shipping_address: parseJson(row.shipping_address, {}),
      preferences: parseJson(row.preferences, {}),
      created_date: row.created_at,
    }));

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserEmail(req);
    const { plan_type, status, price, frequency, next_delivery_date, boxes_received, shipping_address, preferences } = req.body;

    if (!createdBy || !plan_type) {
      return res.status(400).json({ error: 'Dados obrigatorios ausentes' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO subscriptions (id, created_by, plan_type, status, price, frequency, next_delivery_date, boxes_received, shipping_address, preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, createdBy, plan_type, status || 'active', price || 0, frequency || null, next_delivery_date || null, boxes_received || 0, JSON.stringify(shipping_address || {}), JSON.stringify(preferences || {})]
    );
    connection.release();
    res.json({ id, message: 'Assinatura criada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE subscriptions SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status || 'active', id]
    );
    connection.release();
    res.json({ message: 'Assinatura atualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== WALLETS ===============

app.get('/api/wallets', async (req, res) => {
  try {
    const createdBy = getUserEmail(req);
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await connection.query(
      `SELECT * FROM wallets ${whereClause} ORDER BY created_at DESC`,
      params
    );
    connection.release();

    const wallets = rows.map((row) => ({
      id: row.id,
      created_by: row.created_by,
      balance: Number(row.balance || 0),
      transactions: parseJson(row.transactions, []),
      created_date: row.created_at,
    }));

    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wallets', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserEmail(req);
    const { balance, transactions } = req.body;

    if (!createdBy) {
      return res.status(400).json({ error: 'Dados obrigatorios ausentes' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    await connection.query(
      `INSERT INTO wallets (id, created_by, balance, transactions)
       VALUES (?, ?, ?, ?)`,
      [id, createdBy, balance || 0, JSON.stringify(transactions || [])]
    );
    connection.release();
    res.json({ id, message: 'Carteira criada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/wallets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { balance, transactions } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE wallets SET balance = ?, transactions = ?, updated_at = NOW() WHERE id = ?`,
      [balance || 0, JSON.stringify(transactions || []), id]
    );
    connection.release();
    res.json({ message: 'Carteira atualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== ORDERS ===============

app.get('/api/orders', async (req, res) => {
  try {
    const { id, limit, all } = req.query;
    const createdBy = all !== 'true' ? getUserEmail(req) : null;
    const connection = await pool.getConnection();
    const filters = [];
    const params = [];

    if (createdBy) {
      filters.push('created_by = ?');
      params.push(createdBy);
    }

    if (id) {
      filters.push('id = ?');
      params.push(id);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const limitClause = limit ? 'LIMIT ?' : '';
    if (limit) params.push(parseInt(limit));

    const [rows] = await connection.query(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC ${limitClause}`,
      params
    );
    connection.release();

    const orders = rows.map((row) => ({
      id: row.id,
      created_by: row.created_by,
      order_number: row.order_number,
      status: row.status,
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      shipping_method: row.shipping_method,
      tracking_code: row.tracking_code,
      estimated_delivery: row.estimated_delivery,
      subtotal: Number(row.subtotal || 0),
      shipping_cost: Number(row.shipping_cost || 0),
      discount: Number(row.discount || 0),
      wallet_discount: Number(row.wallet_discount || 0),
      wallet_id: row.wallet_id,
      total: Number(row.total || 0),
      coupon_code: row.coupon_code,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      customer_document: row.customer_document,
      items: parseJson(row.items, []),
      shipping_address: parseJson(row.shipping_address, {}),
      asaas_payment_id: row.asaas_payment_id,
      asaas_customer_id: row.asaas_customer_id,
      asaas_invoice_url: row.asaas_invoice_url,
      asaas_bank_slip_url: row.asaas_bank_slip_url,
      asaas_bank_slip_barcode: row.asaas_bank_slip_barcode,
      asaas_payment_due_date: row.asaas_payment_due_date,
      pix_qr_code: row.pix_qr_code,
      pix_qr_code_image: row.pix_qr_code_image,
      created_date: row.created_at,
    }));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido nao encontrado' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      created_by: row.created_by,
      order_number: row.order_number,
      status: row.status,
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      shipping_method: row.shipping_method,
      tracking_code: row.tracking_code,
      estimated_delivery: row.estimated_delivery,
      subtotal: Number(row.subtotal || 0),
      shipping_cost: Number(row.shipping_cost || 0),
      discount: Number(row.discount || 0),
      wallet_discount: Number(row.wallet_discount || 0),
      wallet_id: row.wallet_id,
      total: Number(row.total || 0),
      coupon_code: row.coupon_code,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      customer_document: row.customer_document,
      items: parseJson(row.items, []),
      shipping_address: parseJson(row.shipping_address, {}),
      asaas_payment_id: row.asaas_payment_id,
      asaas_invoice_url: row.asaas_invoice_url,
      asaas_bank_slip_url: row.asaas_bank_slip_url,
      asaas_bank_slip_barcode: row.asaas_bank_slip_barcode,
      asaas_payment_due_date: row.asaas_payment_due_date,
      pix_qr_code: row.pix_qr_code,
      pix_qr_code_image: row.pix_qr_code_image,
      created_date: row.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const createdBy = req.body.created_by || getUserEmail(req) || req.body.customer_email || null;
    const {
      order_number,
      status,
      items,
      subtotal,
      shipping_cost,
      discount,
      wallet_discount,
      wallet_id,
      total,
      coupon_code,
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      shipping_address,
      shipping_method,
      payment_method,
      payment_status,
      estimated_delivery,
    } = req.body;

    if (!order_number || !total) {
      return res.status(400).json({ error: 'Numero do pedido e total sao obrigatorios' });
    }

    const connection = await pool.getConnection();
    const id = uuidv4();
    
    try {
      // Process wallet deduction if wallet_id and wallet_discount are provided
      if (wallet_id && wallet_discount && wallet_discount > 0) {
        // Get wallet
        const [walletRows] = await connection.query(
          'SELECT * FROM wallets WHERE id = ?',
          [wallet_id]
        );
        
        if (walletRows.length > 0) {
          const wallet = walletRows[0];
          const currentBalance = Number(wallet.balance || 0);
          const walletDiscountNum = Number(wallet_discount);
          
          // Check if wallet has enough balance
          if (currentBalance >= walletDiscountNum) {
            const newBalance = currentBalance - walletDiscountNum;
            const transactions = parseJson(wallet.transactions, []);
            
            // Add debit transaction
            transactions.push({
              amount: walletDiscountNum,
              type: 'debit',
              description: `Compra - Pedido ${order_number}`,
              order_id: id,
              date: new Date().toISOString(),
            });
            
            // Update wallet
            await connection.query(
              'UPDATE wallets SET balance = ?, transactions = ?, updated_at = NOW() WHERE id = ?',
              [newBalance, JSON.stringify(transactions), wallet_id]
            );
          } else {
            connection.release();
            return res.status(400).json({ error: 'Saldo insuficiente na carteira' });
          }
        }
      }
      
      await connection.query(
        `INSERT INTO orders
         (id, created_by, order_number, status, items, subtotal, shipping_cost, discount, wallet_discount, wallet_id, total, coupon_code,
          customer_name, customer_email, customer_phone, customer_document, shipping_address, shipping_method, payment_method,
          payment_status, estimated_delivery)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          createdBy,
          order_number,
          status || 'confirmado',
          JSON.stringify(items || []),
          subtotal || 0,
          shipping_cost || 0,
          discount || 0,
          wallet_discount || 0,
          wallet_id || null,
          total,
          coupon_code || null,
          customer_name || null,
          customer_email || null,
          customer_phone || null,
          customer_document || null,
          JSON.stringify(shipping_address || {}),
          shipping_method || null,
          payment_method || null,
          payment_status || 'pendente',
          estimated_delivery || null,
        ]
      );
      connection.release();
      res.json({ id, message: 'Pedido criado' });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, tracking_code } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE orders SET status = ?, payment_status = ?, tracking_code = ?, updated_at = NOW() WHERE id = ?`,
      [status || 'confirmado', payment_status || 'pendente', tracking_code || null, id]
    );
    connection.release();
    res.json({ message: 'Pedido atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== EMAILS ===============

// POST - Enviar email de nota fiscal
app.post('/api/emails/invoice', async (req, res) => {
  try {
    const { orderId, customerEmail, total, items, paymentMethod } = req.body;

    if (!orderId || !customerEmail) {
      return res.status(400).json({ error: 'Order ID e email do cliente são obrigatórios' });
    }

    // Build items list HTML
    const itemsHTML = items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.price?.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(item.price * item.quantity)?.toFixed(2)}</td>
      </tr>
    `).join('') || '';

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: 600; }
            .total { font-size: 18px; font-weight: bold; color: #16a34a; text-align: right; margin-top: 15px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚽ Clube Várzea</h1>
              <p style="margin: 5px 0 0 0;">Confirmação de Pedido</p>
            </div>
            <div class="content">
              <h2>Olá! Seu pedido foi confirmado! 🎉</h2>
              <p>Obrigado por comprar na Clube Várzea. Seu pedido foi processado com sucesso.</p>
              
              <div class="order-info">
                <h3 style="margin-top: 0;">Detalhes do Pedido</h3>
                <p><strong>Número do Pedido:</strong> ${orderId}</p>
                <p><strong>Forma de Pagamento:</strong> ${paymentMethod || 'PIX'}</p>
                
                <h4>Itens do Pedido:</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th style="text-align: center;">Qtd</th>
                      <th style="text-align: right;">Preço Unit.</th>
                      <th style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                </table>
                
                <div class="total">
                  Total: R$ ${total?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <p>Em breve você receberá o código de rastreamento para acompanhar sua entrega.</p>
              <p>Qualquer dúvida, entre em contato conosco.</p>
            </div>
            
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; 2024 Clube Várzea - Todos os direitos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'ricardo.galacho@sparkforge.com.br',
        to: customerEmail,
        subject: `Pedido #${orderId} confirmado - Clube Várzea`,
        html: emailHTML,
      });

      if (error) {
        console.error('Erro ao enviar email de nota fiscal:', error);
        return res.status(500).json({ error: 'Falha ao enviar email', details: error });
      }

      console.log('✅ Email de nota fiscal enviado:', data);
      res.json({ success: true, message: 'Email de nota fiscal enviado', emailId: data.id });
    } else {
      console.log('⚠️ Resend não configurado, email não será enviado');
      res.json({ success: true, message: 'Email não configurado, mas pedido foi criado' });
    }
  } catch (error) {
    console.error('Erro no endpoint de email de nota fiscal:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Enviar email de comissão
app.post('/api/emails/commission', async (req, res) => {
  try {
    const { referrerEmail, referredEmail, orderTotal, commissionAmount, orderId } = req.body;

    if (!referrerEmail || !commissionAmount) {
      return res.status(400).json({ error: 'Email do indicador e valor da comissão são obrigatórios' });
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .commission-box { background: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #16a34a; }
            .amount { font-size: 32px; font-weight: bold; color: #16a34a; margin: 10px 0; }
            .info { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">💰 Clube Várzea</h1>
              <p style="margin: 5px 0 0 0;">Nova Comissão Recebida!</p>
            </div>
            <div class="content">
              <h2>Parabéns! Você ganhou uma comissão! 🎉</h2>
              <p>Uma pessoa que você indicou realizou uma compra e você recebeu uma comissão.</p>
              
              <div class="commission-box">
                <h3 style="margin: 0 0 10px 0; color: #6b7280;">Valor da Comissão</h3>
                <div class="amount">R$ ${commissionAmount?.toFixed(2)}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280;">10% do pedido</p>
              </div>
              
              <div class="info">
                <h3 style="margin-top: 0;">Detalhes da Indicação</h3>
                <p><strong>Pedido:</strong> #${orderId || 'N/A'}</p>
                <p><strong>Cliente indicado:</strong> ${referredEmail || 'Cliente'}</p>
                <p><strong>Valor total do pedido:</strong> R$ ${orderTotal?.toFixed(2) || '0.00'}</p>
              </div>
              
              <p>Continue compartilhando seu código de indicação e ganhe ainda mais comissões!</p>
              <p style="font-size: 14px; color: #6b7280;">A comissão será creditada em sua conta em até 48 horas.</p>
            </div>
            
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; 2024 Clube Várzea - Todos os direitos reservados</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'ricardo.galacho@sparkforge.com.br',
        to: referrerEmail,
        subject: `💰 Nova comissão de R$ ${commissionAmount?.toFixed(2)} - Clube Várzea`,
        html: emailHTML,
      });

      if (error) {
        console.error('Erro ao enviar email de comissão:', error);
        return res.status(500).json({ error: 'Falha ao enviar email', details: error });
      }

      console.log('✅ Email de comissão enviado:', data);
      res.json({ success: true, message: 'Email de comissão enviado', emailId: data.id });
    } else {
      console.log('⚠️ Resend não configurado, email não será enviado');
      res.json({ success: true, message: 'Email não configurado, mas comissão foi registrada' });
    }
  } catch (error) {
    console.error('Erro no endpoint de email de comissão:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============== ASAAS PAYMENT INTEGRATION ===============

// Helper: Criar ou buscar cliente no Asaas
async function getOrCreateAsaasCustomer(customerData) {
  try {
    const { name, email, phone, document, postalCode, addressNumber, address, province } = customerData;
    
    if (!document) {
      throw new Error('CPF/CNPJ não fornecido');
    }
    
    if (!name || !email) {
      throw new Error('Nome e email são obrigatórios');
    }
    
    const cpfCnpj = document.replace(/\D/g, '');
    
    // Validar tamanho do documento
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      throw new Error('CPF deve ter 11 dígitos ou CNPJ 14 dígitos');
    }
    
    // Buscar cliente existente por documento
    const searchResponse = await asaasAPI.get('/customers', {
      params: { cpfCnpj: cpfCnpj }
    });
    
    // Se encontrou cliente, atualizar com dados completos (incluindo endereço para cartão)
    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      const existingCustomer = searchResponse.data.data[0];
      
      const updatePayload = {
        name,
        email,
        cpfCnpj: cpfCnpj,
      };
      
      if (phone) {
        updatePayload.phone = phone.replace(/\D/g, '');
      }
      if (postalCode) {
        updatePayload.postalCode = postalCode.replace(/\D/g, '');
      }
      if (addressNumber) {
        updatePayload.addressNumber = addressNumber;
      }
      if (address) {
        updatePayload.address = address;
      }
      if (province) {
        updatePayload.province = province;
      }
      if (customerData.city) {
        updatePayload.city = customerData.city;
      }
      
      try {
        const updateResponse = await asaasAPI.put(`/customers/${existingCustomer.id}`, updatePayload);
        return updateResponse.data;
      } catch (updateError) {
        return existingCustomer; // Se falhar atualização, usa o existente
      }
    }
    
    // Criar novo cliente com dados completos
    const customerPayload = {
      name,
      email,
      cpfCnpj: cpfCnpj,
      notificationDisabled: true,
    };
    
    // Adicionar telefone se fornecido
    if (phone) {
      customerPayload.phone = phone.replace(/\D/g, '');
    }
    
    // Adicionar endereço se fornecido (obrigatório para cartão de crédito)
    if (postalCode) {
      customerPayload.postalCode = postalCode.replace(/\D/g, '');
    }
    if (addressNumber) {
      customerPayload.addressNumber = addressNumber;
    }
    if (address) {
      customerPayload.address = address;
    }
    if (province) {
      customerPayload.province = province;
    }
    if (customerData.city) {
      customerPayload.city = customerData.city;
    }
    if (customerData.complement) {
      customerPayload.complement = customerData.complement;
    }
    
    const createResponse = await asaasAPI.post('/customers', customerPayload);
    return createResponse.data;
  } catch (error) {
    const errorMessage = error.response?.data?.errors?.[0]?.description || 
                        error.response?.data?.message || 
                        error.message || 
                        'Erro desconhecido';
    
    throw new Error(errorMessage);
  }
}

// Helper: Calcular taxas de parcelamento do Asaas
function getAsaasInstallmentFee(installments) {
  const fees = {
    1: 0, 2: 0.0199, 3: 0.0199, 4: 0.0199, 5: 0.0199, 6: 0.0199,
    7: 0.0249, 8: 0.0249, 9: 0.0249, 10: 0.0249, 11: 0.0249, 12: 0.0249,
  };
  return fees[installments] || 0;
}

// POST - Criar cliente no Asaas
app.post('/api/asaas/customers', async (req, res) => {
  try {
    const customer = await getOrCreateAsaasCustomer(req.body);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Criar cobrança PIX no Asaas
app.post('/api/asaas/payments/pix', async (req, res) => {
  try {
    const { orderId, customerData, value, description } = req.body;
    
    if (!customerData || !customerData.document) {
      return res.status(400).json({ error: 'Dados do cliente incompletos (document obrigatório)' });
    }
    
    const customer = await getOrCreateAsaasCustomer(customerData);
    
    const paymentData = {
      customer: customer.id,
      billingType: 'PIX',
      value: value,
      dueDate: new Date(Date.now() + 15 * 60 * 1000).toISOString().split('T')[0],
      description: description || `Pedido #${orderId}`,
      externalReference: orderId,
    };
    
    const response = await asaasAPI.post('/payments', paymentData);
    const payment = response.data;
    
    // Gerar QR Code PIX
    const pixResponse = await asaasAPI.get(`/payments/${payment.id}/pixQrCode`);
    const pixData = pixResponse.data;
    
    // Adicionar prefixo data: se não existir
    let qrCodeImage = pixData.encodedImage;
    if (qrCodeImage && !qrCodeImage.startsWith('data:')) {
      qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
    }
    
    // Atualizar pedido com dados do Asaas
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE orders SET 
        asaas_customer_id = ?, 
        asaas_payment_id = ?, 
        asaas_invoice_url = ?,
        pix_qr_code = ?,
        pix_qr_code_image = ?
      WHERE id = ?`,
      [customer.id, payment.id, payment.invoiceUrl, pixData.payload, qrCodeImage, orderId]
    );
    connection.release();
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: pixData.payload,
        pixQrCodeImage: qrCodeImage, // Já inclui o prefixo
        expirationDate: payment.dueDate,
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar cobrança PIX:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Falha ao gerar PIX', 
      details: error.message
    });
  }
});

// POST - Processar cartão de crédito no Asaas
app.post('/api/asaas/payments/card', async (req, res) => {
  try {
    const { orderId, customerData, value, description, cardData, installments } = req.body;
    
    // Validar dados obrigatórios
    if (!customerData || !customerData.document) {
      return res.status(400).json({ 
        success: false,
        error: 'Documento do cliente é obrigatório para pagamento com cartão' 
      });
    }
    
    // Validar endereço completo (obrigatório para cartão)
    const requiredAddressFields = ['address', 'province', 'city', 'postalCode'];
    const missingFields = requiredAddressFields.filter(field => !customerData[field] || customerData[field].trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Endereço incompleto. Campos obrigatórios: ${missingFields.join(', ')}` 
      });
    }
    
    const customer = await getOrCreateAsaasCustomer(customerData);
    
    // Garantir que temos o CPF/CNPJ limpo
    const cleanDocument = customerData.document.replace(/\D/g, '');
    const cleanPhone = (customerData.phone || '').replace(/\D/g, '');
    const cleanPostalCode = (customerData.postalCode || '00000000').replace(/\D/g, '');
    
    if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
      return res.status(400).json({ 
        success: false,
        error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' 
      });
    }
    
    // Validar telefone (mínimo 10 dígitos)
    if (cleanPhone.length < 10) {
      return res.status(400).json({ 
        success: false,
        error: 'Telefone inválido. Use formato com DDD (ex: 11999998888)' 
      });
    }
    
    const paymentData = {
      customer: customer.id,
      billingType: 'CREDIT_CARD',
      value: value,
      dueDate: new Date().toISOString().split('T')[0],
      description: description || `Pedido #${orderId}`,
      externalReference: orderId,
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      },
      creditCardHolderInfo: {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: cleanDocument,
        postalCode: cleanPostalCode,
        address: customerData.address,
        addressNumber: customerData.addressNumber || 'SN',
        province: customerData.province,
        city: customerData.city,
        phone: cleanPhone,
      },
    };
    
    if (installments > 1) {
      paymentData.installmentCount = installments;
      paymentData.installmentValue = value / installments;
    }
    
    const response = await asaasAPI.post('/payments', paymentData);
    const payment = response.data;
    
    // Atualizar pedido com dados do Asaas
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE orders SET 
        asaas_customer_id = ?, 
        asaas_payment_id = ?, 
        asaas_invoice_url = ?,
        payment_status = ?
      WHERE id = ?`,
      [customer.id, payment.id, payment.invoiceUrl, payment.status === 'CONFIRMED' ? 'aprovado' : 'pendente', orderId]
    );
    connection.release();
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        installments: installments,
      }
    });
  } catch (error) {
    // Tratar erros específicos do Asaas
    let userMessage = 'Falha ao processar cartão de crédito';
    
    const asaasError = error.response?.data?.errors?.[0]?.description;
    if (asaasError) {
      if (asaasError.includes('CPF') || asaasError.includes('CNPJ')) {
        userMessage = 'Erro de validação: CPF/CNPJ inválido ou incompleto';
      } else if (asaasError.includes('cartão')) {
        userMessage = 'Erro ao processar cartão. Verifique os dados';
      } else {
        userMessage = asaasError;
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: userMessage
    });
  }
});

// POST - Gerar boleto bancário no Asaas
app.post('/api/asaas/payments/boleto', async (req, res) => {
  try {
    const { orderId, customerData, value, description, daysToExpire = 3 } = req.body;
    
    const customer = await getOrCreateAsaasCustomer(customerData);
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToExpire);
    
    const paymentData = {
      customer: customer.id,
      billingType: 'BOLETO',
      value: value,
      dueDate: dueDate.toISOString().split('T')[0],
      description: description || `Pedido #${orderId}`,
      externalReference: orderId,
    };
    
    const response = await asaasAPI.post('/payments', paymentData);
    const payment = response.data;
    
    // Atualizar pedido com dados do Asaas
    const connection = await pool.getConnection();
    await connection.query(
      `UPDATE orders SET 
        asaas_customer_id = ?, 
        asaas_payment_id = ?, 
        asaas_invoice_url = ?,
        asaas_bank_slip_url = ?,
        asaas_bank_slip_barcode = ?,
        asaas_payment_due_date = ?
      WHERE id = ?`,
      [customer.id, payment.id, payment.invoiceUrl, payment.bankSlipUrl, payment.identificationField, payment.dueDate, orderId]
    );
    connection.release();
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
        barCode: payment.identificationField,
        dueDate: payment.dueDate,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar boleto:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao gerar boleto', details: error.response?.data || error.message });
  }
});

// GET - Consultar status de pagamento no Asaas
app.get('/api/asaas/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const response = await asaasAPI.get(`/payments/${paymentId}`);
    const payment = response.data;
    
    // Atualizar status do pedido se necessário
    if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
      const connection = await pool.getConnection();
      const [orders] = await connection.query(
        'SELECT id FROM orders WHERE asaas_payment_id = ?',
        [paymentId]
      );
      
      if (orders.length > 0) {
        await connection.query(
          `UPDATE orders SET payment_status = ?, status = ? WHERE asaas_payment_id = ?`,
          ['aprovado', 'separacao', paymentId]
        );
      }
      connection.release();
    }
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        value: payment.value,
        netValue: payment.netValue,
        confirmedDate: payment.confirmedDate,
      }
    });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao consultar pagamento', details: error.response?.data || error.message });
  }
});

// POST - Webhook do Asaas
app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;
    
    console.log('📨 Webhook Asaas recebido:', event, payment.id);
    
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const connection = await pool.getConnection();
      const [orders] = await connection.query(
        'SELECT id, customer_email FROM orders WHERE asaas_payment_id = ?',
        [payment.id]
      );
      
      if (orders.length > 0) {
        const order = orders[0];
        
        await connection.query(
          `UPDATE orders SET payment_status = ?, status = ?, updated_at = NOW() WHERE id = ?`,
          ['aprovado', 'separacao', order.id]
        );
        
        try {
          const [orderDetails] = await connection.query('SELECT * FROM orders WHERE id = ?', [order.id]);
          const orderData = orderDetails[0];
          
          if (resend) {
            await resend.emails.send({
              from: 'ricardo.galacho@sparkforge.com.br',
              to: orderData.customer_email,
              subject: `Pagamento confirmado - Pedido #${orderData.order_number}`,
              html: `<h1>Pagamento Confirmado!</h1><p>Seu pedido #${orderData.order_number} foi aprovado e está sendo preparado para envio.</p>`,
            });
          }
        } catch (emailError) {
          console.error('Erro ao enviar email de confirmação:', emailError);
        }
      }
      connection.release();
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============== HEALTH CHECK ===============

// DEBUG: Verificar estrutura da tabela orders
app.get('/api/debug/orders-schema', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [columns] = await connection.query('DESC orders');
    connection.release();
    res.json(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Verificar dados de um pedido específico
app.get('/api/debug/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const row = rows[0];
    res.json({
      status: 'OK',
      fields: Object.keys(row),
      data: row,
      customer_document_exists: !!row.customer_document,
      customer_document_value: row.customer_document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 13008;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Banco de dados: ${process.env.DB_NAME || 'clube_varzea'}`);
});
})();

