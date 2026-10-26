-- ==========================================
-- ZHAFRANSTORE.ID CLOUDFLARE D1 DATABASE SCHEMA
-- ==========================================

-- 1. Tabel Kategori Produk
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Produk (dengan Stok Maksimal 999+)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 999,
    game_title TEXT,
    image_url TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    popular INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 3. Tabel Pesanan / Orders (Invoice, Stok Pembelian, & Auto-Delivery)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    game_key TEXT NOT NULL,
    game_username TEXT NOT NULL,
    zone_id TEXT,
    account_link TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL,
    raw_price INTEGER NOT NULL,
    admin_fee INTEGER NOT NULL DEFAULT 500,
    discount_amount INTEGER NOT NULL DEFAULT 0,
    promo_code TEXT,
    price INTEGER NOT NULL,
    buyer_whatsapp TEXT NOT NULL,
    buyer_email TEXT,
    notes TEXT,
    order_mode TEXT DEFAULT 'tanpa_chat_web',
    payment_method TEXT DEFAULT 'qris',
    payment_proof_url TEXT,
    status TEXT DEFAULT 'pending',
    auto_delivered INTEGER DEFAULT 0,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- 4. Tabel Chat Pesanan / Serah Terima Otomatis
CREATE TABLE IF NOT EXISTS order_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chats_order ON order_chats(order_id);

-- 5. Tabel Profil Pengguna / Member Game Global
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    whatsapp TEXT,
    is_guest INTEGER DEFAULT 0,
    game_accounts_json TEXT,
    verified_accounts_json TEXT,
    orders_count INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_order_product TEXT,
    last_game_account TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Kode Promo & Kupon
CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL,
    description TEXT,
    min_purchase INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    valid_until DATETIME
);

-- 7. Tabel Pengaturan Toko & QRIS
CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'store_config',
    store_name TEXT DEFAULT 'Zhafranstore.id',
    store_tagline TEXT DEFAULT 'Pusat Game & Item Gamepass Instan Terpercaya #1',
    admin_whatsapp TEXT DEFAULT '082542778554',
    admin_email TEXT DEFAULT 'zhafran.gibran09@gmail.com',
    qris_image_url TEXT DEFAULT './qris-zhafranstore.jpg',
    payment_instructions TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DATA AWAL (SEED DATA)
-- ==========================================

-- Kategori Bawaan
INSERT OR IGNORE INTO categories (id, name) VALUES 
('gamepass', 'Item Gamepass'),
('game', 'Game PC / Lisensi');

-- Pengaturan Bawaan
INSERT OR IGNORE INTO store_settings (id, store_name, store_tagline, admin_whatsapp, admin_email, qris_image_url) VALUES 
('store_config', 'Zhafranstore.id', 'Pusat Game & Item Gamepass Instan Terpercaya #1', '082542778554', 'zhafran.gibran09@gmail.com', './qris-zhafranstore.jpg');

-- Kode Promo Bawaan
INSERT OR IGNORE INTO promo_codes (code, discount_percent, description, is_active) VALUES 
('ZHAFRANPROMO', 10, 'Diskon Spesial Pelanggan 10%', 1),
('STOREFLASH', 15, 'Promo Kilat Zhafranstore 15%', 1),
('OWNERTHEBEST', 25, 'Diskon Spesial Owner Toko 25%', 1);

-- Produk Bawaan dengan Stok 999
INSERT OR IGNORE INTO products (id, name, category_id, price, stock, game_title, image_url, description, is_active, popular) VALUES 
('prod-blox-fruits-fast-boats', 'Roblox - Fast Boats Gamepass (Blox Fruits)', 'gamepass', 45000, 999, 'Roblox', './game-assets/roblox.png', 'Item Gamepass Blox Fruits Fast Boats. Pengiriman instan via Trade Server / Gift In-game.', 1, 1),
('prod-blox-fruits-2x-mastery', 'Roblox - 2x Mastery Gamepass (Blox Fruits)', 'gamepass', 65000, 999, 'Roblox', './game-assets/roblox.png', 'Gamepass 2x Mastery Blox Fruits permanen. Naikkan level mastery buah iblis dan pedang 2 kali lebih cepat.', 1, 1),
('prod-mlbb-weekly-diamond-pass', 'Mobile Legends - Weekly Diamond Pass (WDP)', 'gamepass', 27500, 999, 'Mobile Legends', './game-assets/mobilelegends.png', 'Weekly Diamond Pass resmi Moonton. Dapatkan total hingga 220 Diamonds + StarLight Point harian.', 1, 1),
('prod-mlbb-1000-diamonds', 'Mobile Legends - 1000 + 155 Diamonds (Fast)', 'gamepass', 235000, 999, 'Mobile Legends', './game-assets/mobilelegends.png', 'Top up kilat Mobile Legends 1155 Diamonds legal 100%. Proses 1-5 menit masuk langsung ke akun MLBB kamu.', 1, 1),
('prod-free-fire-720-dm', 'Free Fire - 720 + 72 Diamonds (Kirim ID)', 'gamepass', 95000, 999, 'Free Fire', './game-assets/freefire.png', 'Top Up Free Fire resmi Garena. Hanya perlu Player ID FF tanpa password. Langsung masuk otomatis dalam 2 menit.', 1, 0),
('prod-game-minecraft-bedrock-java', 'Minecraft: Java & Bedrock Edition (Official)', 'game', 145000, 999, 'Microsoft Store', './game-assets/minecraft.png', 'Paket lengkap Minecraft Java & Bedrock Edition untuk Windows PC. Akun milik pribadi permanen.', 1, 1),
('prod-game-black-myth-wukong', 'Black Myth: Wukong (PC Steam Global Key)', 'game', 649000, 999, 'Steam Game', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', 'Lisensi Original Game Black Myth: Wukong versi PC Steam.', 1, 1),
('prod-game-gta-v-premium', 'Grand Theft Auto V: Premium Edition (PC Steam)', 'game', 185000, 999, 'Rockstar / Steam', 'https://images.unsplash.com/photo-1547394765-185e131e37b2?w=800&auto=format&fit=crop&q=80', 'GTA V Premium Edition termasuk Criminal Enterprise Starter Pack ($1,000,000 bonus cash di GTA Online).', 1, 0);
