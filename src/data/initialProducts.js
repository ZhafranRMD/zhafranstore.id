export const initialStoreSettings = {
  id: "store_config",
  store_name: "Zhafranstore.id",
  store_tagline: "Pusat Game & Item Gamepass Instan Terpercaya #1",
  qris_image_url: "./qris-zhafranstore.jpg",
  admin_whatsapp: "082542778554",
  admin_email: "zhafran.gibran09@gmail.com",
  payment_instructions: "1. Scan kode QRIS menggunakan GoPay, OVO, DANA, BCA, ShopeePay, atau Bank apa saja.\n2. Pastikan nominal transfer sesuai dengan total tagihan.\n3. Simpan dan unggah bukti transfer, lalu klik 'Konfirmasi WhatsApp' untuk pemrosesan kilat 1-5 menit."
};

export const initialCategories = [
  { id: "gamepass", name: "Item Gamepass" },
  { id: "game", name: "Game PC / Lisensi" }
];

export const initialProducts = [
  {
    id: "prod-blox-fruits-fast-boats",
    name: "Roblox - Fast Boats Gamepass (Blox Fruits)",
    category: "gamepass",
    price: 45000,
    stock: 999,
    game_title: "Roblox",
    image_url: "./game-assets/roblox.png",
    description: "Item Gamepass Blox Fruits Fast Boats. Pengiriman instan via Trade Server / Gift In-game. Tuliskan Username Roblox akun kamu pada form checkout.",
    is_active: true,
    popular: true,
    instant_delivery: true
  },
  {
    id: "prod-blox-fruits-2x-mastery",
    name: "Roblox - 2x Mastery Gamepass (Blox Fruits)",
    category: "gamepass",
    price: 65000,
    stock: 999,
    game_title: "Roblox",
    image_url: "./game-assets/roblox.png",
    description: "Gamepass 2x Mastery Blox Fruits permanen. Naikkan level mastery buah iblis dan pedang 2 kali lebih cepat. Pengiriman instan.",
    is_active: true,
    popular: true,
    instant_delivery: true
  },
  {
    id: "prod-mlbb-weekly-diamond-pass",
    name: "Mobile Legends - Weekly Diamond Pass (WDP)",
    category: "gamepass",
    price: 27500,
    stock: 999,
    game_title: "Mobile Legends",
    image_url: "./game-assets/mobilelegends.png",
    description: "Weekly Diamond Pass resmi Moonton. Dapatkan total hingga 220 Diamonds + StarLight Point harian. Cukup cantumkan User ID & Zone ID.",
    is_active: true,
    popular: true,
    instant_delivery: true
  },
  {
    id: "prod-mlbb-1000-diamonds",
    name: "Mobile Legends - 1000 + 155 Diamonds (Fast)",
    category: "gamepass",
    price: 235000,
    stock: 999,
    game_title: "Mobile Legends",
    image_url: "./game-assets/mobilelegends.png",
    description: "Top up kilat Mobile Legends 1155 Diamonds legal 100%. Proses 1-5 menit masuk langsung ke akun MLBB kamu. Kirim format: ID (Zone).",
    is_active: true,
    popular: true,
    instant_delivery: true
  },
  {
    id: "prod-free-fire-720-dm",
    name: "Free Fire - 720 + 72 Diamonds (Kirim ID)",
    category: "gamepass",
    price: 95000,
    stock: 999,
    game_title: "Free Fire",
    image_url: "./game-assets/freefire.png",
    description: "Top Up Free Fire resmi Garena. Hanya perlu Player ID FF tanpa password. Langsung masuk otomatis dalam 2 menit.",
    is_active: true,
    popular: false,
    instant_delivery: true
  },
  {
    id: "prod-genshin-welkin-moon",
    name: "Genshin Impact - Blessing of the Welkin Moon",
    category: "gamepass",
    price: 75000,
    stock: 999,
    game_title: "Genshin Impact",
    image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
    description: "Paket Welkin Moon 30 Hari resmi miHoYo/HoYoverse. Dapatkan 300 Genesis Crystals instan + 90 Primogems setiap hari. Cukup kirim UID & Server.",
    is_active: true,
    popular: true,
    instant_delivery: true
  },
  {
    id: "prod-valorant-2050-vp",
    name: "Valorant - 2050 Valorant Points (Riot ID)",
    category: "gamepass",
    price: 220000,
    stock: 999,
    game_title: "Valorant",
    image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    description: "Top up Valorant Points region Indonesia / SEA. Masukkan Riot ID beserta tag (#ID). Pengiriman instan dan aman anti rollback.",
    is_active: true,
    popular: false,
    instant_delivery: true
  },
  {
    id: "prod-game-black-myth-wukong",
    name: "Black Myth: Wukong (PC Steam Global Key)",
    category: "game",
    price: 649000,
    stock: 999,
    game_title: "Steam Game",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    description: "Lisensi Original Game Black Myth: Wukong versi PC Steam. Kode lisensi digital langsung dikirimkan ke WhatsApp pembeli setelah pembayaran terverifikasi.",
    is_active: true,
    popular: true,
    instant_delivery: false
  },
  {
    id: "prod-game-minecraft-bedrock-java",
    name: "Minecraft: Java & Bedrock Edition (Official)",
    category: "game",
    price: 145000,
    stock: 999,
    game_title: "Microsoft Store",
    image_url: "./game-assets/minecraft.png",
    description: "Paket lengkap Minecraft Java & Bedrock Edition untuk Windows PC. Akun milik pribadi permanen, bisa ganti email dan password sesuka hati.",
    is_active: true,
    popular: true,
    instant_delivery: false
  },
  {
    id: "prod-game-gta-v-premium",
    name: "Grand Theft Auto V: Premium Edition (PC Steam)",
    category: "game",
    price: 185000,
    stock: 999,
    game_title: "Rockstar / Steam",
    image_url: "https://images.unsplash.com/photo-1547394765-185e131e37b2?w=800&auto=format&fit=crop&q=80",
    description: "GTA V Premium Edition termasuk Criminal Enterprise Starter Pack ($1,000,000 bonus cash di GTA Online). Dikirim via Steam Gift / Product Key resmi.",
    is_active: true,
    popular: false,
    instant_delivery: false
  },
  {
    id: "prod-game-elden-ring",
    name: "Elden Ring + Shadow of the Erdtree Bundle",
    category: "game",
    price: 580000,
    stock: 999,
    game_title: "Steam Game",
    image_url: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&auto=format&fit=crop&q=80",
    description: "Game of The Year Elden Ring lengkap beserta ekspansi DLC terbarunya. Key resmi Steam Region Indonesia.",
    is_active: true,
    popular: false,
    instant_delivery: false
  },
  {
    id: "prod-game-fc25",
    name: "EA SPORTS FC 25 Standard Edition (PC)",
    category: "game",
    price: 499000,
    stock: 999,
    game_title: "EA App / Steam",
    image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    description: "Game sepak bola terbaru dari EA SPORTS. Nikmati mode Ultimate Team, Karier Manajer, dan gameplay FC IQ generasi terkini.",
    is_active: true,
    popular: true,
    instant_delivery: false
  }
];
