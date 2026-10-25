# Zhafranstore.id — Game & Gamepass Instant Storefront

Platform toko digital mandiri (*self-hosted webstore*) modern bertema **Dark Gaming Store** untuk penjualan lisensi game dan item gamepass secara instan tanpa perlu registrasi rumit.

---

## ⚡ Fitur Utama & Kepatuhan PRD

| ID PRD | Fitur | Keterangan & Implementasi |
| :--- | :--- | :--- |
| **FR-01** | **Katalog & Filter Kategori** | Grid produk responsif dengan tab filter *Semua*, *Game*, *Gamepass*, live search, dan sorting harga/popularitas. |
| **FR-02** | **Tombol "Bayar Sekarang"** | Setiap kartu produk memiliki tombol aksi cepat yang memicu *Instant Checkout Modal* tanpa reload halaman (*zero page reload*). |
| **FR-03** | **Form Target Akun Game** | Input wajib `Username / ID Game`, `Server / Zone ID` (opsional), dan `No. WhatsApp Pembeli` untuk pengiriman item. |
| **FR-04** | **Pemilih Metode Bayar 2 Grup** | Dikelompokkan rapi ke dalam **1) QRIS Instan** dan **2) Checkout via E-Commerce** (Shopee, Tokopedia, TikTok Shop). |
| **FR-05** | **Tampilan QRIS Dinamis dari Foto Admin** | Menampilkan foto QRIS resmi (`QRIS Zhafranstore.id.jpg`), total nominal Rupiah, tombol unduh QRIS, unggah bukti bayar, dan konfirmasi WhatsApp otomatis ke Admin. |
| **FR-06** | **Integrasi Link Marketplace** | Tombol bermerek resmi yang mengarahkan pembeli ke listing produk di Shopee, Tokopedia, atau TikTok Shop. |
| **FR-07** | **Admin: Manajemen Produk (CRUD)** | Tambah, edit, hapus produk (Game & Gamepass), ubah harga, upload foto, stok aktif, serta tautan marketplace. |
| **FR-08** | **Admin: Pengaturan QRIS & Toko** | Unggah/ganti foto QRIS langsung dari galeri dengan live preview, ubah nama toko, dan nomor WhatsApp Admin. |
| **FR-09** | **Admin: Daftar Pesanan Masuk** | Tabel order masuk dari pembeli QRIS & marketplace, status pesanan (*Pending* -> *Diproses* -> *Selesai*), viewer bukti transfer, dan tombol chat pembeli WA langsung. |

---

## 🔑 Kredensial & Akses Admin Panel
- **Akses Dashboard Admin**: Klik tombol **"Admin"** di bagian kanan atas *header*.
- **Default PIN Admin**: `zhafran2026` (atau `admin123`).

---

## 🚀 Cara Menjalankan Proyek di Komputer Lokal

```bash
# Masuk ke direktori proyek
cd "d:\devproject\zhafranstore.id"

# Menjalankan server pengembangan (Local Dev Server)
npm run dev

# Membangun bundle produksi (Production Build)
npm run build
```

Aplikasi dapat langsung diakses di browser pada: **`http://localhost:5173/`**

---

## 💳 File QRIS Pembayaran
Foto QRIS baku yang digunakan terletak di:
- Berkas sumber: `d:\devproject\zhafranstore.id\QRIS Zhafranstore.id.jpg`
- Static asset publik: `public/qris-zhafranstore.jpg`
Pemilik toko dapat mengganti gambar QRIS ini kapan saja melalui **Dashboard Admin (`/admin`)**.

---

## 🛡️ Aturan Basis Data (Firebase Firestore)
- Menggunakan proyek bersama `zhafran-firebase` dari `d:\devproject\configuration\Firebasefirestore.txt`.
- Namespace path terisolasi: `/apps/zhafranstore/...`
- Dilengkapi dengan *IndexedDB persistent cache* dan mekanisme *local fallback* sehingga aplikasi tetap berjalan lancar 100% baik online maupun offline.
