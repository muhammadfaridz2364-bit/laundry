import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { hashPassword } from '../src/password.js';

/**
 * Mengisi database dengan data dummy untuk demo: penjual & pembeli tambahan,
 * produk, dan pesanan. Aman dijalankan berulang (memakai INSERT IGNORE).
 *
 *   npm run db:dummy
 */

const PASSWORD = process.env.DUMMY_PASSWORD || process.env.SEED_DEMO_PASSWORD || 'Demo#2026LZ';

const SELLERS = [
  { email: 'seller2@laundryzahra.test', nama: 'Bersih Wangi Laundry' },
  { email: 'seller3@laundryzahra.test', nama: 'Kilat Laundry Express' },
  { email: 'seller4@laundryzahra.test', nama: 'Toko Perlengkapan Zahra' },
];

const BUYERS = [
  { email: 'buyer2@laundryzahra.test', nama: 'Rina Kartika' },
  { email: 'buyer3@laundryzahra.test', nama: 'Budi Santoso' },
  { email: 'buyer4@laundryzahra.test', nama: 'Dewi Lestari' },
  { email: 'buyer5@laundryzahra.test', nama: 'Agus Pramono' },
  { email: 'buyer6@laundryzahra.test', nama: 'Nur Aisyah' },
  { email: 'buyer7@laundryzahra.test', nama: 'Fajar Ramadhan' },
];

// [id, penjual, nama, kategori, harga, stok, deskripsi, unggulan]
const PRODUCTS = [
  ['p-d01', 'seller2@laundryzahra.test', 'Cuci Kering Lipat', 'Layanan', 6000, 50, 'Cuci dan lipat rapi, harga per kilogram.', 0],
  ['p-d02', 'seller2@laundryzahra.test', 'Setrika Premium', 'Layanan', 8000, 25, 'Setrika uap untuk pakaian kerja dan kemeja.', 1],
  ['p-d03', 'seller2@laundryzahra.test', 'Cuci Bed Cover King', 'Perawatan Khusus', 50000, 6, 'Bed cover ukuran king, harga per potong.', 0],
  ['p-d04', 'seller2@laundryzahra.test', 'Cuci Gorden', 'Perawatan Khusus', 30000, 10, 'Gorden rumah, harga per meter persegi.', 0],
  ['p-d05', 'seller2@laundryzahra.test', 'Pengering Saja', 'Layanan', 4000, 80, 'Pengeringan tanpa cuci, harga per kilogram.', 0],
  ['p-d06', 'seller3@laundryzahra.test', 'Cuci Express 3 Jam', 'Layanan', 15000, 12, 'Selesai 3 jam, kuota harian terbatas.', 1],
  ['p-d07', 'seller3@laundryzahra.test', 'Cuci Karpet', 'Perawatan Khusus', 25000, 4, 'Karpet ukuran sedang, harga per meter persegi.', 0],
  ['p-d08', 'seller3@laundryzahra.test', 'Cuci Bantal & Guling', 'Perawatan Khusus', 20000, 15, 'Bantal dan guling, harga per pasang.', 0],
  ['p-d09', 'seller3@laundryzahra.test', 'Cuci Tas Kanvas', 'Perawatan Khusus', 35000, 3, 'Tas kanvas dan ransel, harga per buah.', 0],
  ['p-d10', 'seller3@laundryzahra.test', 'Setrika Express', 'Layanan', 9000, 20, 'Setrika selesai di hari yang sama.', 0],
  ['p-d11', 'seller4@laundryzahra.test', 'Pelembut Pakaian 1 L', 'Perlengkapan', 18000, 40, 'Pelembut aroma lavender, botol 1 liter.', 0],
  ['p-d12', 'seller4@laundryzahra.test', 'Detergen Cair 2 L', 'Perlengkapan', 32000, 35, 'Detergen cair konsentrat untuk semua jenis kain.', 1],
  ['p-d13', 'seller4@laundryzahra.test', 'Hanger Plastik 10 pcs', 'Perlengkapan', 12000, 60, 'Hanger plastik kuat, isi 10 buah.', 0],
  ['p-d14', 'seller4@laundryzahra.test', 'Sikat Pakaian', 'Perlengkapan', 8000, 25, 'Sikat lembut untuk kerah dan manset.', 0],
  ['p-d15', 'seller4@laundryzahra.test', 'Jaring Cuci Bra', 'Perlengkapan', 10000, 40, 'Jaring pelindung bra saat dicuci, isi 2 buah.', 0],
  ['p-d16', 'seller@laundryzahra.test', 'Cuci Setrika Express 12 Jam', 'Layanan', 10000, 30, 'Selesai 12 jam, harga per kilogram.', 0],
  ['p-d17', 'seller@laundryzahra.test', 'Pewangi Sachet 10 pcs', 'Perlengkapan', 5000, 100, 'Pewangi sachet untuk dibawa bepergian.', 0],
  ['p-d18', 'seller@laundryzahra.test', 'Cuci Boneka', 'Perawatan Khusus', 28000, 10, 'Boneka ukuran sedang, harga per buah.', 0],
  ['p-d19', 'seller@laundryzahra.test', 'Cuci Pakaian Harian', 'Layanan', 6500, 80, 'Paket harian per kilogram: cuci, kering, dan lipat.', 1],
  ['p-d20', 'seller@laundryzahra.test', 'Cuci Kemeja & Seragam Kerja', 'Layanan', 9000, 30, 'Kemeja dan seragam kerja, harga per potong.', 1],
  ['p-d21', 'seller2@laundryzahra.test', 'Cuci Seragam Sekolah', 'Layanan', 8000, 40, 'Seragam sekolah putih dan batik, harga per potong.', 0],
  ['p-d22', 'seller2@laundryzahra.test', 'Setrika Kemeja', 'Layanan', 6000, 35, 'Setrika uap khusus kemeja agar rapi dan licin.', 0],
  ['p-d23', 'seller2@laundryzahra.test', 'Cuci Seprai', 'Perawatan Khusus', 15000, 20, 'Seprai ukuran queen atau king, harga per lembar.', 1],
  ['p-d24', 'seller3@laundryzahra.test', 'Cuci Handuk', 'Perawatan Khusus', 12000, 25, 'Handuk mandi dan handuk wajah, harga per lembar.', 0],
  ['p-d25', 'seller3@laundryzahra.test', 'Cuci Jaket & Hoodie', 'Perawatan Khusus', 20000, 18, 'Jaket, hoodie, dan sweater, harga per potong.', 0],
  ['p-d26', 'seller4@laundryzahra.test', 'Cuci Celana Jeans', 'Perawatan Khusus', 18000, 16, 'Jeans dan celana bahan, harga per potong.', 0],
];

// [kode, produk, pembeli, jumlah, status, hariLalu, catatan]
const ORDERS = [
  ['LZ-DUMMY-01', 'p-d02', 'buyer2@laundryzahra.test', 3, 'baru', 1, 'Antar besok pagi'],
  ['LZ-DUMMY-02', 'p-d06', 'buyer3@laundryzahra.test', 1, 'baru', 1, ''],
  ['LZ-DUMMY-03', 'p-d01', 'buyer4@laundryzahra.test', 4, 'diproses', 2, 'Pisahkan pakaian putih'],
  ['LZ-DUMMY-04', 'p-d12', 'buyer5@laundryzahra.test', 2, 'selesai', 3, ''],
  ['LZ-DUMMY-05', 'p-d08', 'buyer6@laundryzahra.test', 1, 'selesai', 4, 'Ambil sendiri'],
  ['LZ-DUMMY-06', 'p-001', 'buyer7@laundryzahra.test', 5, 'diproses', 2, ''],
  ['LZ-DUMMY-07', 'p-d03', 'buyer2@laundryzahra.test', 1, 'selesai', 6, 'Bed cover warna gelap'],
  ['LZ-DUMMY-08', 'p-d07', 'buyer3@laundryzahra.test', 2, 'dibatalkan', 7, 'Jadwal diubah pelanggan'],
  ['LZ-DUMMY-09', 'p-d11', 'buyer4@laundryzahra.test', 1, 'selesai', 8, ''],
  ['LZ-DUMMY-10', 'p-003', 'buyer5@laundryzahra.test', 3, 'baru', 1, 'Butuh sore ini'],
  ['LZ-DUMMY-11', 'p-d16', 'buyer6@laundryzahra.test', 2, 'diproses', 2, ''],
  ['LZ-DUMMY-12', 'p-d13', 'buyer7@laundryzahra.test', 3, 'selesai', 9, ''],
  ['LZ-DUMMY-13', 'p-d09', 'buyer2@laundryzahra.test', 1, 'baru', 1, 'Tas warna krem'],
  ['LZ-DUMMY-14', 'p-006', 'buyer3@laundryzahra.test', 1, 'diproses', 3, 'Sepatu putih'],
];

function toDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function ensureUser(db, { email, nama, role }) {
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) return rows[0].id;

  const [result] = await db.execute(
    'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [nama, email, hashPassword(PASSWORD), role],
  );
  return result.insertId;
}

async function main() {
  const db = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    const sellerIds = new Map();
    for (const seller of SELLERS) {
      sellerIds.set(seller.email, await ensureUser(db, { ...seller, role: 'seller' }));
    }

    const buyerIds = new Map();
    for (const buyer of BUYERS) {
      buyerIds.set(buyer.email, await ensureUser(db, { ...buyer, role: 'buyer' }));
    }

    const [sellerRows] = await db.query("SELECT id, email FROM users WHERE role IN ('seller', 'admin')");
    for (const row of sellerRows) sellerIds.set(row.email, row.id);

    const productInfo = new Map();
    for (const [id, sellerEmail, nama, kategori, harga, stok, deskripsi, unggulan] of PRODUCTS) {
      const sellerId = sellerIds.get(sellerEmail);
      if (!sellerId) throw new Error(`Penjual ${sellerEmail} belum ada; jalankan npm run db:setup dulu.`);

      await db.execute(
        `INSERT IGNORE INTO products (id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
         VALUES (?, ?, ?, ?, ?, ?, ?, '', ?)`,
        [id, sellerId, nama, kategori, harga, stok, deskripsi, unggulan],
      );
      productInfo.set(id, { nama, harga, sellerId });
    }

    const [productRows] = await db.query('SELECT id, nama, harga, seller_id FROM products');
    for (const row of productRows) {
      productInfo.set(row.id, { nama: row.nama, harga: Number(row.harga), sellerId: row.seller_id });
    }

    let insertedOrders = 0;
    for (const [kode, productId, buyerEmail, jumlah, status, daysAgo, catatan] of ORDERS) {
      const product = productInfo.get(productId);
      const buyerId = buyerIds.get(buyerEmail);
      if (!product || !buyerId) continue;

      const total = product.harga * jumlah;
      const createdAt = toDateTime(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000));

      const [result] = await db.execute(
        `INSERT IGNORE INTO orders (kode, buyer_id, seller_id, product_id, nama_produk, jumlah, harga_satuan, total, catatan, status, dibuat_pada)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [kode, buyerId, product.sellerId, productId, product.nama, jumlah, product.harga, total, catatan, status, createdAt],
      );
      insertedOrders += result.affectedRows;
    }

    const [counts] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM users) AS pengguna,
        (SELECT COUNT(*) FROM products) AS produk,
        (SELECT COUNT(*) FROM orders) AS pesanan`,
    );

    console.log(`✓ Data dummy siap. Pesanan baru: ${insertedOrders}.`);
    console.log(`  Total sekarang → pengguna: ${counts[0].pengguna}, produk: ${counts[0].produk}, pesanan: ${counts[0].pesanan}`);
    console.log(`  Password untuk akun dummy: ${PASSWORD}`);
    console.log('  Contoh login: seller2@laundryzahra.test / buyer2@laundryzahra.test');
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('✗ Gagal mengisi data dummy:', error.message);
  process.exit(1);
});
