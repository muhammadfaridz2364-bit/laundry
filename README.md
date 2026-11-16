# Laundry Zahra

Aplikasi katalog laundry dengan akun **admin**, **penjual**, dan **pembeli**.

## Menjalankan aplikasi

1. Salin `.env.example` menjadi `.env`, lalu isi `SESSION_SECRET` dengan nilai acak minimal 32 karakter.
2. Pastikan MySQL berjalan. Atur `DB_*` di `.env` jika koneksinya berbeda dari konfigurasi contoh.
3. Pasang dependensi dan siapkan database:

   ```sh
   npm install
   npm run db:setup
   ```

4. Jalankan aplikasi:

   ```sh
   npm start
   ```

5. Buka `http://localhost:3000`. Beranda katalog terbuka tanpa login; tombol **Masuk** dan **Daftar** tersedia di pojok kanan atas.

## Akun dan peran

`npm run db:setup` membuat akun admin menggunakan `SEED_ADMIN_EMAIL` (default `admin@laundryzahra.test`). Password admin dibuat secara acak dan ditampilkan di terminal saat akun pertama kali dibuat, kecuali `SEED_ADMIN_PASSWORD` diatur di `.env`.

Dengan `SEED_DEMO=true` (default), setup juga membuat akun demo:

- Penjual: `seller@laundryzahra.test`
- Pembeli: `buyer@laundryzahra.test`

Password kedua akun demo diatur oleh `SEED_DEMO_PASSWORD` (default `Demo#2026LZ`). Ganti password demo sebelum aplikasi digunakan secara publik. Akun baru dapat mendaftar sebagai pembeli atau penjual; pembuatan dan pengelolaan admin dibatasi untuk setup/admin.

Jika katalog tidak dapat mengambil data dari database, aplikasi menampilkan delapan produk contoh untuk pratinjau. Produk tersebut diberi label dan tidak dapat dipesan; perbaiki koneksi database agar katalog aktif kembali.

GitHub Pages hanya dapat menyajikan pratinjau statis. Untuk mengaktifkan login, pemesanan, dashboard, dan data MySQL, jalankan atau deploy server Node.js ke layanan yang mendukung backend.
