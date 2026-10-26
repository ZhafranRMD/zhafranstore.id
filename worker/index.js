/**
 * Zhafranstore.id — Cloudflare Worker Backend API with Cloudflare D1 SQL
 * Mengelola API Database Edge D1 + Static Assets Single-Page Application
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
  "Content-Type": "application/json"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message, success: false }), {
    status,
    headers: CORS_HEADERS
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Handle REST API Routes
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        console.error("D1 API Error:", err);
        return errorResponse(err.message || "Internal Server Error", 500);
      }
    }

    // Fallback: Sajikan Single Page Application (dist)
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function handleApi(request, env, url) {
  const db = env.DB;
  if (!db) {
    return errorResponse("Database binding D1 (env.DB) tidak terhubung", 500);
  }

  const path = url.pathname.replace(/^\/api/, "");
  const method = request.method;

  // 1. HEALTH CHECK
  if (path === "/health" || path === "") {
    const check = await db.prepare("SELECT 1 as alive;").first();
    return jsonResponse({
      status: "online",
      database: "Cloudflare D1 (SQLite Edge)",
      region: "APAC (Singapore)",
      alive: check?.alive === 1
    });
  }

  // 2. PRODUK
  // GET /api/products
  if (path === "/products" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
    return jsonResponse(results || []);
  }

  // POST /api/products (Tambah / Update Produk dengan Stok s/d 999+)
  if (path === "/products" && method === "POST") {
    const body = await request.json();
    const id = body.id || `prod-${Date.now()}`;
    const stock = body.stock !== undefined ? Math.max(0, parseInt(body.stock, 10) || 0) : 999;
    const price = parseInt(body.price, 10) || 0;
    const popular = body.popular ? 1 : 0;
    const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1;

    await db.prepare(`
      INSERT INTO products (id, name, category_id, price, stock, game_title, image_url, description, is_active, popular, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category_id = excluded.category_id,
        price = excluded.price,
        stock = excluded.stock,
        game_title = excluded.game_title,
        image_url = excluded.image_url,
        description = excluded.description,
        is_active = excluded.is_active,
        popular = excluded.popular,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      id,
      body.name,
      body.category || body.category_id || 'gamepass',
      price,
      stock,
      body.game_title || '',
      body.image_url || '',
      body.description || '',
      isActive,
      popular
    ).run();

    const saved = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
    return jsonResponse(saved, 201);
  }

  // DELETE /api/products/:id
  if (path.startsWith("/products/") && method === "DELETE") {
    const prodId = decodeURIComponent(path.split("/")[2]);
    await db.prepare("DELETE FROM products WHERE id = ?").bind(prodId).run();
    return jsonResponse({ success: true, message: `Produk ${prodId} berhasil dihapus` });
  }

  // 3. KATEGORI
  // GET /api/categories
  if (path === "/categories" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM categories ORDER BY created_at ASC").all();
    return jsonResponse(results || []);
  }

  // POST /api/categories
  if (path === "/categories" && method === "POST") {
    const body = await request.json();
    const id = body.id || (body.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    await db.prepare("INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)").bind(id, body.name).run();
    return jsonResponse({ id, name: body.name }, 201);
  }

  // DELETE /api/categories/:id
  if (path.startsWith("/categories/") && method === "DELETE") {
    const catId = decodeURIComponent(path.split("/")[2]);
    await db.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
    return jsonResponse({ success: true, message: `Kategori ${catId} dihapus` });
  }

  // 4. PESANAN (ORDERS)
  // GET /api/orders
  if (path === "/orders" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100").all();
    return jsonResponse(results || []);
  }

  // POST /api/orders (Buat Pesanan & Pengurangan Stok Atomik)
  if (path === "/orders" && method === "POST") {
    const body = await request.json();
    const invoiceId = body.id || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qty = Math.max(1, parseInt(body.quantity, 10) || 1);
    const unitPrice = parseInt(body.unit_price, 10) || parseInt(body.price, 10) || 0;
    const rawPrice = parseInt(body.raw_price, 10) || (unitPrice * qty);
    const adminFee = body.admin_fee !== undefined ? parseInt(body.admin_fee, 10) : 500;
    const discountAmount = parseInt(body.discount_amount, 10) || 0;
    const finalPrice = parseInt(body.price, 10) || Math.max(0, rawPrice + adminFee - discountAmount);

    // Transaksi Atomik: Potong Stok Produk di D1 Database
    if (body.product_id) {
      await db.prepare(`
        UPDATE products 
        SET stock = MAX(0, stock - ?) 
        WHERE id = ?
      `).bind(qty, body.product_id).run();
    }

    // Insert Pesanan Baru
    await db.prepare(`
      INSERT INTO orders (
        id, product_id, product_name, game_key, game_username, zone_id,
        account_link, quantity, unit_price, raw_price, admin_fee, discount_amount,
        promo_code, price, buyer_whatsapp, buyer_email, notes, order_mode,
        payment_method, payment_proof_url, status, auto_delivered, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      invoiceId,
      body.product_id || '',
      body.product_name || 'Item Game',
      body.game_key || 'roblox',
      body.game_username || '',
      body.zone_id || '',
      body.account_link || '',
      qty,
      unitPrice,
      rawPrice,
      adminFee,
      discountAmount,
      body.promo_code || null,
      finalPrice,
      body.buyer_whatsapp || '',
      body.buyer_email || null,
      body.notes || '',
      body.order_mode || 'tanpa_chat_web',
      body.payment_method || 'qris',
      body.payment_proof_url || null
    ).run();

    // Catat / Perbarui Profil Pembeli Secara Otomatis
    if (body.buyer_email || body.buyer_whatsapp) {
      const uId = (body.buyer_email || body.buyer_whatsapp).trim().toLowerCase();
      await db.prepare(`
        INSERT INTO user_profiles (id, email, whatsapp, is_guest, orders_count, total_spent, last_order_product, last_game_account, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          orders_count = orders_count + 1,
          total_spent = total_spent + excluded.total_spent,
          last_order_product = excluded.last_order_product,
          last_game_account = excluded.last_game_account,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        uId,
        body.buyer_email || null,
        body.buyer_whatsapp || null,
        body.buyer_email ? 0 : 1,
        finalPrice,
        body.product_name || '',
        body.game_username || ''
      ).run();
    }

    const createdOrder = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(invoiceId).first();
    return jsonResponse(createdOrder, 201);
  }

  // PATCH /api/orders/:id/status (Update Status & Checklist)
  if (path.match(/^\/orders\/[^/]+\/status$/) && method === "PATCH") {
    const orderId = path.split("/")[2];
    const { status } = await request.json();
    await db.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, orderId).run();
    const updated = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
    return jsonResponse(updated);
  }

  // POST /api/orders/:id/auto-deliver (Eksekusi Pengiriman Otomatis ke Game)
  if (path.match(/^\/orders\/[^/]+\/auto-deliver$/) && method === "POST") {
    const orderId = path.split("/")[2];
    const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
    if (!order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    // Set status order menjadi selesai dan auto_delivered
    await db.prepare(`
      UPDATE orders 
      SET status = 'selesai', auto_delivered = 1, delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(orderId).run();

    // Kirim pesan sistem otomatis ke chat pesanan
    const deliveryMsg = `⚡ [PENGIRIMAN OTOMATIS SUKSES - CLOUDFLARE D1]\nPembayaran telah terverifikasi! Pesanan ${order.product_name} sebanyak ${order.quantity || 1} stok telah BERHASIL DIKIRIM OTOMATIS ke akun: ${order.game_username}.\nSilakan cek item/saldo di akun game kamu sekarang. Terima kasih telah berbelanja di Zhafranstore.id! ⭐`;

    await db.prepare(`
      INSERT INTO order_chats (order_id, sender, sender_name, text, created_at)
      VALUES (?, 'system', 'Sistem Pengiriman Otomatis Zhafranstore', ?, CURRENT_TIMESTAMP)
    `).bind(orderId, deliveryMsg).run();

    const delivered = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
    return jsonResponse({ success: true, order: delivered, message: "Pesanan berhasil dikirim otomatis" });
  }

  // DELETE /api/orders/:id
  if (path.startsWith("/orders/") && method === "DELETE") {
    const orderId = decodeURIComponent(path.split("/")[2]);
    await db.prepare("DELETE FROM orders WHERE id = ?").bind(orderId).run();
    await db.prepare("DELETE FROM order_chats WHERE order_id = ?").bind(orderId).run();
    return jsonResponse({ success: true, message: `Pesanan ${orderId} berhasil dihapus` });
  }

  // 5. CHAT PESANAN
  // GET /api/chats/:orderId
  if (path.startsWith("/chats/") && method === "GET") {
    const orderId = decodeURIComponent(path.split("/")[2]);
    const { results } = await db.prepare("SELECT * FROM order_chats WHERE order_id = ? ORDER BY created_at ASC").bind(orderId).all();
    return jsonResponse(results || []);
  }

  // POST /api/chats/:orderId
  if (path.startsWith("/chats/") && method === "POST") {
    const orderId = decodeURIComponent(path.split("/")[2]);
    const body = await request.json();
    await db.prepare(`
      INSERT INTO order_chats (order_id, sender, sender_name, text, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      orderId,
      body.sender || 'buyer',
      body.sender_name || 'Pembeli',
      body.text || ''
    ).run();

    const { results } = await db.prepare("SELECT * FROM order_chats WHERE order_id = ? ORDER BY created_at ASC").bind(orderId).all();
    return jsonResponse(results || [], 201);
  }

  // 6. PROFIL PENGGUNA (MEMBERSHIP & AKUN GAME)
  // GET /api/users/profiles
  if (path === "/users/profiles" && method === "GET") {
    const { results } = await db.prepare("SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 100").all();
    return jsonResponse(results || []);
  }

  // POST /api/users/profiles
  if (path === "/users/profiles" && method === "POST") {
    const body = await request.json();
    const id = (body.email || body.whatsapp || `guest-${Date.now()}`).trim().toLowerCase();
    await db.prepare(`
      INSERT INTO user_profiles (id, email, whatsapp, is_guest, game_accounts_json, verified_accounts_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        whatsapp = excluded.whatsapp,
        game_accounts_json = excluded.game_accounts_json,
        verified_accounts_json = excluded.verified_accounts_json,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      id,
      body.email || null,
      body.whatsapp || null,
      body.isGuest ? 1 : 0,
      JSON.stringify(body.gameAccounts || {}),
      JSON.stringify(body.verifiedAccounts || {})
    ).run();

    const profile = await db.prepare("SELECT * FROM user_profiles WHERE id = ?").bind(id).first();
    return jsonResponse(profile, 201);
  }

  // 7. PENGATURAN TOKO (QRIS & SETTINGS)
  // GET /api/settings
  if (path === "/settings" && method === "GET") {
    const settings = await db.prepare("SELECT * FROM store_settings WHERE id = 'store_config'").first();
    return jsonResponse(settings || {});
  }

  // PUT /api/settings
  if (path === "/settings" && method === "PUT") {
    const body = await request.json();
    await db.prepare(`
      INSERT INTO store_settings (id, store_name, store_tagline, admin_whatsapp, admin_email, qris_image_url, payment_instructions, updated_at)
      VALUES ('store_config', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        store_name = excluded.store_name,
        store_tagline = excluded.store_tagline,
        admin_whatsapp = excluded.admin_whatsapp,
        admin_email = excluded.admin_email,
        qris_image_url = excluded.qris_image_url,
        payment_instructions = excluded.payment_instructions,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      body.store_name || 'Zhafranstore.id',
      body.store_tagline || '',
      body.admin_whatsapp || '082542778554',
      body.admin_email || 'zhafran.gibran09@gmail.com',
      body.qris_image_url || './qris-zhafranstore.jpg',
      body.payment_instructions || ''
    ).run();

    const updated = await db.prepare("SELECT * FROM store_settings WHERE id = 'store_config'").first();
    return jsonResponse(updated);
  }

  return errorResponse(`Endpoint API ${method} ${path} tidak ditemukan`, 404);
}
