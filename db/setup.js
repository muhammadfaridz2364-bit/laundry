import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { hashPassword, randomPassword } from '../src/password.js';
import { DEFAULT_TEMPLATE, DEFAULT_WA } from '../src/wa.js';

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, '..', '.env');

const SAMPLE = [
  ['p-001', 'Cuci Setrika Reguler', 'Layanan', 7000, 40, 'Cuci, keringkan, dan setrika rapi. Harga per kilogram.', 1],
  ['p-002', 'Setrika Saja', 'Layanan', 5000, 60, 'Setrika tanpa cuci untuk pakaian yang sudah bersih. Harga per kilogram.', 0],
  ['p-003', 'Cuci Express 6 Jam', 'Layanan', 12000, 15, 'Selesai dalam 6 jam, per kilogram, sesuai kuota harian.', 1],
  ['p-004', 'Dry Clean Jas', 'Perawatan Khusus', 45000, 8, 'Perawatan dry clean untuk jas dan blazer. Harga per potong.', 0],
  ['p-005', 'Cuci Selimut Tebal', 'Perawatan Khusus', 35000, 12, 'Selimut dan bed cover tebal, harga per potong.', 0],
  ['p-006', 'Cuci Sepatu', 'Perawatan Khusus', 40000, 5, 'Cuci sepatu sneakers, harga per pasang.', 0],
  ['p-007', 'Pewangi Pakaian 800 ml', 'Perlengkapan', 22000, 30, 'Pewangi aroma lembut untuk bilasan terakhir. Ukuran 800 ml.', 0],
  ['p-008', 'Kantong Laundry Zip', 'Perlengkapan', 3000, 120, 'Kantong plastik zip untuk memisahkan pakaian per pelanggan.', 1],
];

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

/** Membaca password tanpa menampilkan hasil ketikan (readline dengan echo dibisukan). */
function askPassword(question) {
  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return rl.question(question).finally(() => rl.close());
  }

  const muted = new Writable({
    write(chunk, encoding, callback) {
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  process.stdout.write(question);
  return rl.question('').finally(() => {
    rl.close();
    process.stdout.write('\n');
  });
}

/** Membersihkan karakter kontrol/sisa escape (misalnya dari paste) sebelum dipakai. */
function cleanPassword(raw) {
  return String(raw ?? '')
    .replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
}

function persistPassword(password) {
  const value = /^[A-Za-z0-9_.+@-]+$/.test(password) ? password : JSON.stringify(password);
  const line = `DB_PASSWORD=${value}`;

  if (!existsSync(envFile)) {
    writeFileSync(envFile, `${line}\n`);
    console.log('✓ Password disimpan ke .env.');
    return;
  }

  const content = readFileSync(envFile, 'utf8');
  const updated = /^DB_PASSWORD=.*$/m.test(content)
    ? content.replace(/^DB_PASSWORD=.*$/m, () => line)
    : `${content.replace(/\s*$/, '')}\n${line}\n`;
  writeFileSync(envFile, updated);
  console.log('✓ Password disimpan ke .env (DB_PASSWORD), jadi `npm start` ikut bisa.');
}

/**
 * Menentukan password MySQL. Jika DB_PASSWORD kosong, coba tanpa password dulu;
 * bila ditolak, minta pengguna mengetik password lalu simpan ke .env.
 */
async function resolvePassword(base) {
  if (base.password) return base.password;

  try {
    const probe = await mysql.createConnection({ ...base, password: '' });
    await probe.end();
    return '';
  } catch (error) {
    if (error.code !== 'ER_ACCESS_DENIED_ERROR') throw error;
  }

  console.log(`\nUser MySQL "${base.user}@${base.host}" membutuhkan password (DB_PASSWORD masih kosong di .env).`);
  console.log('Ketik password MySQL di bawah ini. Input tidak ditampilkan dan akan disimpan ke .env.\n');

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const password = cleanPassword(await askPassword(`Password MySQL untuk "${base.user}": `));

    if (!password) {
      console.log('Password kosong. Masukkan password atau tekan Ctrl+C untuk berhenti.');
      continue;
    }

    console.log(`→ Menerima ${password.length} karakter.`);

    try {
      const probe = await mysql.createConnection({ ...base, password });
      await probe.end();
      persistPassword(password);
      return password;
    } catch (error) {
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`✗ Password ditolak (percobaan ${attempt} dari 3). Coba lagi.`);
        continue;
      }
      console.log(`✗ Gagal terhubung: ${error.code ?? ''} ${error.message}`);
      throw error;
    }
  }

  throw new Error(
    'Tidak bisa masuk ke MySQL. Set password root lewat MySQL Installer > Reconfigure (atau Workbench), lalu jalankan `npm run db:setup` lagi.',
  );
}

async function ensureUser(db, { nama, email, password, role }) {
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) return { id: rows[0].id, created: false };

  const [result] = await db.execute(
    'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [nama, email, hashPassword(password), role],
  );
  return { id: result.insertId, created: true };
}

async function main() {
  const { database, connectionLimit, ...base } = config.db;
  const password = await resolvePassword(base);

  const bootstrap = await mysql.createConnection({ ...base, password, multipleStatements: true });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
  );
  await bootstrap.end();

  const db = await mysql.createConnection({ ...base, password, database, multipleStatements: true });
  try {
    const statements = splitStatements(readFileSync(join(here, 'schema.sql'), 'utf8'));
    for (const statement of statements) await db.query(statement);
    console.log(`✓ Skema database "${database}" siap (${statements.length} pernyataan).`);

    const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@laundryzahra.test').toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomPassword('Admin');
    const admin = await ensureUser(db, {
      nama: 'Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    if (admin.created) {
      console.log(`✓ Admin dibuat: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`• Admin sudah ada: ${adminEmail} (password tidak diubah)`);
    }

    await db.execute(
      'INSERT INTO settings (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE kunci = kunci',
      ['wa_number', DEFAULT_WA],
    );
    await db.execute(
      'INSERT INTO settings (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE kunci = kunci',
      ['wa_template', DEFAULT_TEMPLATE],
    );

    if ((process.env.SEED_DEMO ?? 'true') === 'true') {
      const sellerEmail = (process.env.SEED_DEMO_SELLER_EMAIL ?? 'seller@laundryzahra.test').toLowerCase();
      const buyerEmail = (process.env.SEED_DEMO_BUYER_EMAIL ?? 'buyer@laundryzahra.test').toLowerCase();
      const demoPassword = process.env.SEED_DEMO_PASSWORD || randomPassword('Demo');

      const seller = await ensureUser(db, {
        nama: 'Laundry Zahra Demo',
        email: sellerEmail,
        password: demoPassword,
        role: 'seller',
      });
      const buyer = await ensureUser(db, {
        nama: 'Pembeli Demo',
        email: buyerEmail,
        password: demoPassword,
        role: 'buyer',
      });

      for (const [id, nama, kategori, harga, stok, deskripsi, unggulan] of SAMPLE) {
        await db.execute(
          `INSERT IGNORE INTO products (id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
           VALUES (?, ?, ?, ?, ?, ?, ?, '', ?)`,
          [id, seller.id, nama, kategori, harga, stok, deskripsi, unggulan],
        );
      }

      console.log(
        `✓ Data demo: penjual ${sellerEmail}, pembeli ${buyerEmail} (password: ${seller.created || buyer.created ? demoPassword : 'tidak diubah'}), 8 produk contoh.`,
      );
    }

    console.log('\nSelesai. Jalankan `npm start` lalu buka http://localhost:3000');
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error('✗ Setup database gagal:', error.message);
  process.exit(1);
});
