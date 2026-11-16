# SPEC.md — Laundry Zahra (Katalog & Dashboard Produk UMKM)

Versi dokumen: 0.3 (foto produk lokal + template WhatsApp yang dapat diedit admin)
Catatan versi 0.3: katalog memakai foto produk lokal dan pesan WhatsApp memakai template yang dapat diatur admin (F-03, F-16, §4.4, Aturan Bisnis 4–5, AC-03, AC-10, AC-30, AC-32, AC-34, AC-36, AC-37).
Tanggal: 16 November 2026
Konteks: latihan pengembangan 1 hari. Data seluruhnya fiktif dan nonpribadi.

---

## 1. Tujuan

Menyediakan aplikasi web sederhana bagi UMKM jasa cuci pakaian ("Laundry Zahra") untuk:

1. Menampilkan katalog layanan dan perlengkapan agar calon pembeli mudah mencari, menyaring, dan mengurutkan produk.
2. Memungkinkan calon pembeli memesan produk tertentu dengan satu klik melalui WhatsApp.
3. Memberi pengelola toko dashboard demo untuk melihat ringkasan dan mengelola data produk (CRUD).
4. Menyimpan data di perangkat yang sama menggunakan `localStorage`, tanpa backend.

Hasil yang diharapkan dalam 1 hari: prototype berjalan di satu file HTML, lalu dipecah menjadi proyek Vite + JavaScript vanilla.

---

## 2. Pengguna

| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| Calon pembeli | Pelanggan yang ingin melihat layanan dan harga sebelum memesan. | Melihat katalog, mencari, memfilter, dan memesan lewat WhatsApp. |
| Pengelola toko | Pemilik atau karyawan yang mengelola daftar produk. | Melihat ringkasan, menambah, mengubah, dan menghapus produk. |

Catatan:
- Kedua peran memakai **perangkat yang sama** dan **tanpa login**. Tidak ada akun, tidak ada sesi, dan tidak ada pemisahan hak akses. Beralih peran dilakukan lewat navigasi "Katalog" dan "Dashboard".
- Tidak ada login palsu. Tampilan tidak boleh memberi kesan bahwa ada autentikasi.

---

## 3. Daftar Fitur (MVP)

| ID | Fitur | Deskripsi singkat | Prioritas |
|---|---|---|---|
| F-01 | Katalog produk | Menampilkan kartu produk: gambar, nama, kategori, deskripsi, harga (Rupiah), stok, dan badge unggulan. | Wajib |
| F-02 | Data contoh | Pertama kali dibuka (localStorage kosong), aplikasi memuat 8 produk contoh. | Wajib |
| F-03 | Foto produk lokal | Jika `imageUrl` kosong, tampil foto lokal dari `public/img/products/` yang dipilih otomatis berdasarkan nama/kategori produk (mis. mesin cuci untuk layanan cuci, sepatu untuk Cuci Sepatu, karpet untuk Cuci Karpet). Foto disajikan dari server sendiri tanpa permintaan ke domain eksternal. Jika `imageUrl` diisi, URL itu yang dipakai. Jika gambar gagal dimuat, tampil placeholder inisial. | Wajib |
| F-04 | Pencarian | Pencarian teks tidak peka huruf besar-kecil pada `nama` dan `deskripsi`. | Wajib |
| F-05 | Filter kategori | Dropdown berisi kategori unik dari data, plus opsi "Semua kategori". | Wajib |
| F-06 | Sorting | Nama A–Z, harga terendah, harga tertinggi, stok terbanyak. | Wajib |
| F-07 | Pesan WhatsApp | Tombol membuka `wa.me` dengan teks pesan dari template yang dapat diatur admin (§4.4). Pembeli memesan lewat dialog lalu mendapat tautan berisi kode pesanan; tautan cepat admin/penjual memakai template yang sama. Tombol nonaktif jika stok 0. | Wajib |
| F-08 | Dashboard ringkasan | Kartu ringkasan: total produk, total stok, jumlah kategori. | Wajib |
| F-09 | Dashboard CRUD | Tabel produk dengan aksi Tambah, Ubah, dan Hapus (Hapus memakai konfirmasi). | Wajib |
| F-10 | Validasi form | Validasi semua field sebelum menyimpan; pesan error ditampilkan di form. | Wajib |
| F-11 | Penyimpanan localStorage | Setiap perubahan disimpan ke `localStorage` dan dibaca ulang saat aplikasi dibuka. | Wajib |
| F-12 | Muat ulang data contoh | Tombol untuk mengembalikan 8 produk contoh (dengan konfirmasi). | Pendukung |
| F-13 | Penanganan data rusak | Jika data di localStorage tidak valid, aplikasi tetap berjalan dengan data contoh dan menampilkan notifikasi. | Wajib |
| F-14 | Tema pink | Seluruh UI memakai palet pink (header gradasi, latar pink muda, tombol dan badge pink). Tombol nonaktif memakai abu-abu agar tetap terbaca sebagai nonaktif. | Wajib |
| F-15 | Gambar pendukung | Banner hero katalog memakai foto mesin cuci lokal; thumbnail produk di tabel dashboard; pratinjau gambar di form tambah/ubah yang mengikuti nama, kategori, dan URL yang diisi. | Wajib |
| F-16 | Template WhatsApp (admin) | Admin mengatur nomor WhatsApp toko dan template pesan di dashboard. Template mendukung placeholder `{toko}`, `{produk}`, `{jumlah}`, `{total}`, `{kode}`, `{catatan}` dan dipakai semua tautan WhatsApp. Pratinjau pesan diperbarui saat mengetik. | Wajib |

---

## 4. Data Model

### 4.1 Entitas `Product`

| Field | Tipe | Wajib | Aturan validasi | Contoh |
|---|---|---|---|---|
| `id` | string | Ya | Unik. Dibuat otomatis untuk produk baru. Format `p-<timestamp base36><random>`. | `"p-001"` |
| `nama` | string | Ya | Setelah di-trim, 2–80 karakter. | `"Cuci Setrika Reguler"` |
| `kategori` | string | Ya | Setelah di-trim, 1–40 karakter. Disarankan: Layanan, Perawatan Khusus, Perlengkapan. | `"Layanan"` |
| `harga` | number | Ya | Angka, finite, `>= 0`. Mata uang Rupiah, tanpa desimal di UI. | `7000` |
| `stok` | integer | Ya | Bilangan bulat, `>= 0`. | `40` |
| `deskripsi` | string | Tidak | Maksimal 300 karakter. Boleh kosong. | `"Cuci, keringkan, dan setrika rapi. Harga per kilogram."` |
| `imageUrl` | string | Tidak | Kosong, atau URL dengan protokol `http:` / `https:`. Jika kosong, pakai foto lokal sesuai nama/kategori produk. | `""` |
| `unggulan` | boolean | Ya | `true` atau `false`. Default `false`. | `true` |

### 4.2 Penyimpanan

- Key localStorage: `laundry-zahra:products:v1`
- Nilai: JSON array of `Product`.
- Versi di key memungkinkan migrasi di iterasi berikutnya.

### 4.3 Data contoh (8 produk)

| id | nama | kategori | harga | stok | unggulan |
|---|---|---|---|---|---|
| p-001 | Cuci Setrika Reguler | Layanan | 7000 | 40 | Ya |
| p-002 | Setrika Saja | Layanan | 5000 | 60 | Tidak |
| p-003 | Cuci Express 6 Jam | Layanan | 12000 | 15 | Ya |
| p-004 | Dry Clean Jas | Perawatan Khusus | 45000 | 8 | Tidak |
| p-005 | Cuci Selimut Tebal | Perawatan Khusus | 35000 | 12 | Tidak |
| p-006 | Cuci Sepatu | Perawatan Khusus | 40000 | 5 | Tidak |
| p-007 | Pewangi Pakaian 800 ml | Perlengkapan | 22000 | 30 | Tidak |
| p-008 | Kantong Laundry Zip | Perlengkapan | 3000 | 120 | Ya |

Nilai turunan yang diharapkan dari data contoh: total produk = 8, total stok = 290, jumlah kategori = 3.

Catatan: data contoh bersifat fiktif. Tidak ada nama orang, nomor telepon, atau alamat nyata.

### 4.4 Pengaturan Toko (`settings`)

Disimpan sebagai pasangan kunci–nilai di database dan hanya dapat diubah admin.

| Kunci | Isi | Aturan | Contoh |
|---|---|---|---|
| `wa_number` | Nomor WhatsApp toko | Format `08…` atau `62…`, 10–15 digit; disimpan dalam format `62…`. | `62812345678910` |
| `wa_template` | Template pesan WhatsApp | Wajib, maksimal 500 karakter. Placeholder: `{toko}`, `{produk}`, `{jumlah}`, `{total}`, `{kode}`, `{catatan}`. Teks lain dipakai apa adanya, termasuk baris baru dan `*tebal*`. | lihat Aturan Bisnis 4 |

Placeholder yang tidak berlaku pada tautan cepat katalog (mis. `{kode}`) diisi `-`.

---

## 5. Aturan Bisnis

1. **Stok 0** berarti produk tidak bisa dipesan. Kartu menampilkan "Stok habis" dan tombol WhatsApp nonaktif.
2. **Stok** pada layanan diartikan sebagai kuota harian (misalnya kg atau potong yang masih bisa diterima). Pada perlengkapan, stok berarti jumlah fisik. Arti ini ditulis di deskripsi produk.
3. **Harga** ditampilkan dengan format Rupiah `id-ID`, contoh `Rp 7.000`.
4. **Pesan WhatsApp** memakai template `wa_template` (§4.4), bukan teks tetap. Template default:
   ```
   Halo *{toko}*, saya ingin memesan:
   • {produk} × {jumlah}
   • Total: {total}
   Kode pesanan: {kode}
   Catatan: {catatan}

   Apakah pesanan saya bisa diproses?
   ```
   Pesanan pembeli mengisi semua placeholder dari data pesanan; tautan cepat katalog mengisi `{jumlah}` = 1, `{total}` = harga produk, serta `{kode}` dan `{catatan}` = `-`.
5. **Nomor WhatsApp toko** disimpan di pengaturan database (`wa_number`) dan diubah admin lewat dashboard. Nilai default masih placeholder dan harus diganti sebelum dipakai nyata.
6. **Hapus produk** selalu meminta konfirmasi. Penghapusan bersifat permanen di localStorage.
7. **Unggulan** hanya menjadi penanda visual (badge). Urutan tampilan tidak berubah karena unggulan.

---

## 6. Alur Layar

### 6.1 Tampilan Katalog
- Header pink dengan nama toko dan navigasi "Katalog" / "Dashboard".
- Banner hero: judul "Cucian bersih, wangi, dan rapi" dengan ilustrasi mesin cuci.
- Baris kontrol: kolom pencarian, dropdown kategori, dropdown sorting.
- Teks jumlah hasil: "Menampilkan X dari Y produk".
- Grid kartu produk. Jika tidak ada hasil, tampil pesan "Tidak ada produk yang cocok."

### 6.2 Tampilan Dashboard
- Pemberitahuan (notice) untuk status penyimpanan atau aksi.
- Tiga kartu ringkasan: total produk, total stok, jumlah kategori.
- Tombol "Tambah produk" dan "Muat ulang data contoh".
- Tabel: Nama (dengan thumbnail dan deskripsi singkat), Kategori, Harga, Stok, Unggulan, Aksi (Ubah, Hapus).

### 6.3 Dialog Form (tambah/ubah)
- Field: nama, kategori (dengan saran datalist), harga, stok, deskripsi, URL gambar (opsional), unggulan (checkbox).
- Pratinjau gambar di bawah field URL. Diperbarui saat pengguna mengetik.
- Tombol Batal dan Simpan. Escape menutup dialog.
- Error validasi ditampilkan sekaligus di bawah form.

---

## 7. Nonfunctional Requirements

| ID | Kategori | Requirement |
|---|---|---|
| NFR-01 | Teknologi | Prototype berupa satu file HTML dengan CSS dan JavaScript vanilla. Target produksi: Vite + JavaScript vanilla. Tidak ada framework UI. |
| NFR-02 | Backend | Tidak ada backend, database server, atau API eksternal untuk data. |
| NFR-03 | Keamanan | Tidak menyimpan API key, token, atau kredensial apa pun di kode. |
| NFR-04 | Keamanan | Semua data yang ditampilkan di-escape agar tidak terjadi XSS. Input HTML tampil sebagai teks. |
| NFR-05 | Keamanan | `imageUrl` hanya menerima `http:` atau `https:`, atau kosong (foto lokal otomatis). Protokol lain (misalnya `javascript:`) ditolak. |
| NFR-06 | Privasi | Data hanya disimpan di localStorage perangkat. Tidak ada pengiriman data ke server. Data contoh bersifat nonpersonal. |
| NFR-07 | Lisensi aset | Foto produk memakai stok foto Pexels (lisensi bebas pakai, tanpa kewajiban atribusi), diunduh dan disajikan sebagai aset lokal di `public/img/products/` tanpa hotlink. Ilustrasi SVG dan placeholder inisial tetap dibuat sendiri di kode sebagai cadangan. |
| NFR-08 | Performa | Katalog 8 produk tampil di bawah 300 ms setelah halaman dibuka pada perangkat menengah. Pencarian dan filter memperbarui hasil tanpa jeda terlihat. |
| NFR-09 | Responsivitas | Layout berfungsi pada lebar 360 px hingga 1440 px. Tidak ada scroll horizontal pada katalog. |
| NFR-10 | Aksesibilitas | Semua kontrol bisa diakses dengan keyboard. Input memiliki label. Kontras teks minimal WCAG AA. Gambar memiliki `alt`. |
| NFR-11 | Kompatibilitas | Browser modern terbaru (Chrome, Edge, Firefox, Safari). Tidak perlu polyfill. |
| NFR-12 | Ketahanan | Jika localStorage tidak tersedia atau penuh, aplikasi tetap bisa dipakai dalam memori dan menampilkan peringatan. |
| NFR-13 | Pemeliharaan | Validasi, render, dan penyimpanan dipisah dalam fungsi yang jelas. Konstanta (kunci storage, nomor WA, data contoh) berada di satu tempat. |

---

## 8. Risiko dan Mitigasi

| ID | Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|---|
| R-01 | Data hilang karena pengguna menghapus data browser. | Tinggi | Sedang | Tombol muat ulang data contoh; catatan di README bahwa data bersifat lokal. Ekspor/impor JSON masuk iterasi berikutnya. |
| R-02 | Data tidak sinkron antarperangkat. | Sedang | Tinggi | Dicatat sebagai batasan. Out of scope untuk MVP. |
| R-03 | Nomor WhatsApp placeholder ikut dipakai ke produksi. | Tinggi | Sedang | Konstanta dengan komentar "GANTI"; checklist sebelum rilis. |
| R-04 | XSS dari input nama/deskripsi atau `imageUrl`. | Tinggi | Rendah | Escape di semua render; validasi protokol URL; AC-15 dan AC-16. |
| R-05 | Pengguna menempelkan URL gambar berhak cipta. | Sedang | Sedang | Field URL bersifat opsional; aplikasi tidak mengunduh gambar ke proyek; catatan kebijakan di panduan pengelola. |
| R-06 | Ambiguitas arti stok (kuota vs fisik). | Sedang | Tinggi | Aturan bisnis 5.2; label di deskripsi produk. |
| R-07 | Data localStorage rusak karena edit manual. | Sedang | Rendah | Validasi saat load; baris invalid dilewati; data contoh dipakai jika seluruh data tidak valid. |
| R-08 | Prototype single HTML sulit dirawat saat fitur bertambah. | Sedang | Tinggi | Migrasi ke Vite di iterasi 1 sesuai implementation plan. |
| R-09 | Harga dengan desimal membingungkan untuk Rupiah. | Rendah | Sedang | Input harga memakai angka bulat; UI menampilkan tanpa desimal. |
| R-10 | Kuota kapasitas tidak dikurangi otomatis saat pesanan masuk. | Sedang | Tinggi | Dicatat sebagai out of scope; stok diubah manual oleh pengelola. |

---

## 9. Out of Scope (MVP)

- Login, registrasi, peran pengguna, atau hak akses.
- Backend, database server, API, dan sinkronisasi antarperangkat.
- Keranjang belanja, checkout, pembayaran, dan pelacakan status pesanan.
- Pengurangan stok otomatis saat pesanan masuk.
- Upload gambar dari perangkat (hanya URL opsional atau placeholder).
- Multi-bahasa (UI dalam Bahasa Indonesia).
- Ekspor dan impor data (CSV/JSON).
- Riwayat perubahan (audit log).
- Notifikasi WhatsApp otomatis atau integrasi WhatsApp Business API.
- Pengujian otomatis (unit/e2e). Pengujian dilakukan manual lewat acceptance criteria.
- PWA, mode offline khusus, dan service worker.
- Analitik dan pelacakan pengguna.

---

## 10. Acceptance Criteria (dapat diperiksa manual)

Cara pemeriksaan: buka aplikasi di browser, mulai dengan localStorage kosong (DevTools > Application > Local Storage > hapus key `laundry-zahra:products:v1`), lalu jalankan langkah yang tertulis. Hasil harus sesuai kolom "Hasil yang diharapkan".

| ID | Fitur | Langkah pemeriksaan | Hasil yang diharapkan |
|---|---|---|---|
| AC-01 | F-02 | Buka aplikasi dengan localStorage kosong. | Katalog menampilkan tepat 8 kartu produk. |
| AC-02 | F-01 | Periksa satu kartu. | Ada gambar/placeholder, nama, kategori, deskripsi, harga dengan format `Rp 7.000`, teks stok, dan badge "Unggulan" jika `unggulan` = true. |
| AC-03 | F-03 | Lihat kartu yang `imageUrl`-nya kosong. | Foto lokal yang sesuai tampil (misalnya mesin cuci untuk Cuci Setrika Reguler, sepatu untuk Cuci Sepatu). Semua gambar dimuat dari server sendiri (`/img/products/…`), tanpa permintaan ke domain eksternal. |
| AC-04 | F-04 | Ketik "setrika" di pencarian. | Muncul 2 produk: Cuci Setrika Reguler dan Setrika Saja. Teks hasil: "Menampilkan 2 dari 8 produk". |
| AC-05 | F-04 | Ketik "PEWANGI" (huruf besar). | Muncul 1 produk: Pewangi Pakaian 800 ml. |
| AC-06 | F-05 | Pilih kategori "Perlengkapan". | Muncul 2 produk: Pewangi Pakaian 800 ml dan Kantong Laundry Zip. |
| AC-07 | F-05 + F-04 | Pilih kategori "Layanan" lalu ketik "express". | Muncul 1 produk: Cuci Express 6 Jam. |
| AC-08 | F-06 | Pilih "Harga terendah". | Urutan: Kantong Laundry Zip (3.000), Setrika Saja (5.000), Cuci Setrika Reguler (7.000), Cuci Express 6 Jam (12.000), Pewangi (22.000), Cuci Selimut Tebal (35.000), Cuci Sepatu (40.000), Dry Clean Jas (45.000). |
| AC-09 | F-06 | Pilih "Harga tertinggi", lalu "Nama A–Z", lalu "Stok terbanyak". | Urutan berubah sesuai pilihan. Stok terbanyak dimulai dari Kantong Laundry Zip (120). |
| AC-10 | F-07 | Sebagai pembeli, klik "Pesan via WhatsApp" pada Setrika Saja lalu kirim pesanan. | Pesanan tercatat, dialog menampilkan kode pesanan, dan tautan `wa.me` berisi template aktif yang sudah terisi nama produk, jumlah, total, dan kode. |
| AC-11 | F-07 | Sebagai penjual, ubah stok sebuah produk menjadi 0, lalu buka katalog. | Badge "Stok habis" tampil. Tombol bertuliskan "Stok habis" dan tidak bisa diklik. |
| AC-12 | F-08 | Buka Dashboard. | Kartu menampilkan Total produk = 8, Total stok = 290, Jumlah kategori = 3. |
| AC-13 | F-09 + F-10 | Klik "Tambah produk", isi nama "Test Produk", kategori "Layanan", harga 10000, stok 5, lalu Simpan. | Dialog tertutup. Produk baru ada di tabel dan katalog. Total produk = 9. |
| AC-14 | F-10 | Tambah produk dengan harga `-1`. | Form menampilkan pesan "Harga harus angka ≥ 0." Dialog tetap terbuka. Data tidak berubah. |
| AC-15 | F-10 | Isi stok `1.5`. | Form menampilkan pesan "Stok harus bilangan bulat ≥ 0." Data tidak berubah. |
| AC-16 | F-10 | Kosongkan nama, atau isi nama 1 karakter. | Pesan "Nama 2–80 karakter." tampil. Data tidak berubah. |
| AC-17 | NFR-05 | Isi URL gambar `javascript:alert(1)`. | Form menolak dengan pesan "URL gambar harus http/https atau kosong." |
| AC-18 | NFR-04 | Isi nama dengan `<img src=x onerror=alert(1)>` lalu simpan. | Teks tampil apa adanya sebagai teks biasa. Tidak ada alert dan tidak ada gambar rusak yang dieksekusi. |
| AC-19 | F-09 | Klik "Ubah" pada Pewangi, ubah harga menjadi 25000, simpan. | Harga di tabel dan kartu katalog menjadi "Rp 25.000". ID produk tidak berubah. |
| AC-20 | F-09 | Klik "Hapus" pada salah satu produk, lalu pilih Batal di konfirmasi. | Produk tetap ada. |
| AC-21 | F-09 | Klik "Hapus", lalu pilih OK. | Produk hilang dari tabel dan katalog. Total produk berkurang 1. |
| AC-22 | F-11 | Tambah atau ubah satu produk, lalu muat ulang halaman (F5). | Perubahan tetap ada. |
| AC-23 | F-12 | Klik "Muat ulang data contoh", lalu OK. | Kembali menjadi 8 produk contoh. |
| AC-24 | F-13 | Di DevTools, ubah isi localStorage menjadi `{bukan-array`, lalu muat ulang. | Aplikasi tetap terbuka, menampilkan 8 produk contoh, dan muncul notifikasi tentang data rusak. |
| AC-25 | NFR-12 | Blokir localStorage (mode private/kebijakan browser), lalu tambah produk. | Aplikasi tetap berjalan. Notifikasi menyatakan perubahan hanya sementara. |
| AC-26 | NFR-09 | Buka di lebar 360 px. | Kartu menjadi satu kolom. Tidak ada scroll horizontal pada katalog. Kontrol tetap bisa dipakai. |
| AC-27 | NFR-10 | Gunakan hanya keyboard: Tab ke kontrol, Enter untuk membuka dialog, Esc untuk menutup. | Semua kontrol dapat difokus dan dipakai. Fokus terlihat jelas. |
| AC-28 | NFR-02, NFR-06 | Buka DevTools > Network lalu lakukan pencarian dan pesan WhatsApp. | Tidak ada permintaan data ke server. Satu-satunya navigasi keluar adalah tautan `wa.me` saat tombol diklik. |
| AC-29 | NFR-03, NFR-07 | Cari di kode dan aset: kata `api_key`, `token`, `password`, dan file gambar eksternal. | Tidak ada hasil. Placeholder dibuat dari SVG di kode. |
| AC-30 | R-03 | Buka dashboard admin lalu periksa nomor WhatsApp toko. | Nomor berasal dari pengaturan database (`wa_number`), bukan konstanta di kode, dan diganti dengan nomor asli sebelum rilis. |
| AC-31 | F-14 | Buka aplikasi di browser. | Header berwarna pink dengan gradasi. Latar halaman pink muda. Tombol "Pesan via WhatsApp" dan tombol utama berwarna pink. Tombol "Stok habis" berwarna abu-abu. |
| AC-32 | F-15 | Lihat banner di bagian atas katalog. | Banner menampilkan judul "Cucian bersih, wangi, dan rapi" dan foto mesin cuci lokal. |
| AC-33 | F-15 | Buka Dashboard. | Setiap baris tabel menampilkan thumbnail produk di sisi kiri nama. |
| AC-34 | F-15 | Klik "Tambah produk", ketik nama "Setrika Test", lalu ganti menjadi "Cuci Sepatu". | Pratinjau menampilkan foto setrika, lalu berganti foto sepatu saat nama diubah. Mengosongkan nama mengembalikan foto default. |
| AC-35 | F-15 | Isi URL gambar yang gagal dimuat (misalnya `https://contoh.invalid/a.jpg`), lalu lihat katalog. | Gambar diganti placeholder inisial. Aplikasi tidak macet dan tidak menampilkan ikon gambar rusak. |
| AC-36 | F-16 | Sebagai admin, ubah nomor menjadi `0812345678910` lalu simpan. | Nomor tersimpan sebagai `62812345678910`, tampil "Nomor aktif: +62812345678910", dan tautan WhatsApp berikutnya memakai nomor itu. |
| AC-37 | F-16 | Sebagai admin, ganti template menjadi `Halo {toko}, pesanan {kode}: {produk} x{jumlah} = {total}`, lalu buat pesanan sebagai pembeli. | Pesan WhatsApp memakai template baru dengan semua placeholder terisi, dan pratinjau di dashboard berubah saat mengetik. |

Kriteria lulus iterasi: semua AC wajib (AC-01 sampai AC-28 dan AC-31 sampai AC-37) lulus. AC-29 dan AC-30 diperiksa sebelum rilis.

---

## 11. Implementation Plan per Iterasi

Total estimasi: sekitar 6–7 jam kerja untuk latihan 1 hari.

### Iterasi 0 — Prototype single HTML (sekitar 1,5 jam)
- Tujuan: semua fitur F-01 sampai F-13 berjalan di satu file HTML.
- Output: `laundry-zahra.html`.
- Definition of done: AC-01 sampai AC-28 lulus secara manual.

### Iterasi 1 — Setup Vite dan struktur modul (sekitar 1 jam)
- Buat proyek `npm create vite@latest laundry-zahra -- --template vanilla`.
- Struktur yang diusulkan:
  ```
  src/
    main.js            // inisialisasi, event wiring
    data/sample.js     // 8 produk contoh
    model/validate.js  // validasi dan normalisasi
    storage.js         // load/save localStorage, penanganan error
    catalog.js         // render katalog, filter, sort, pesan WA
    dashboard.js       // ringkasan dan tabel CRUD
    form.js            // dialog form
    utils.js           // esc, rupiah, placeholderFor, isSafeUrl
    style.css
  index.html
  ```
- Definition of done: `npm run dev` dan `npm run build` berjalan tanpa error. Perilaku sama dengan prototype.

### Iterasi 2 — Katalog lengkap (sekitar 1 jam)
- Pencarian, filter kategori, sorting, placeholder gambar, tombol WhatsApp, dan status stok habis.
- Definition of done: AC-02 sampai AC-11 lulus.

### Iterasi 3 — Dashboard dan CRUD (sekitar 1,5 jam)
- Kartu ringkasan, tabel, dialog tambah/ubah, validasi lengkap, konfirmasi hapus, muat ulang data contoh.
- Definition of done: AC-12 sampai AC-23 lulus.

### Iterasi 4 — Penyimpanan dan ketahanan (sekitar 1 jam)
- Penanganan data rusak, localStorage tidak tersedia, dan normalisasi data saat load.
- Definition of done: AC-22, AC-24, AC-25 lulus.

### Iterasi 5 — Polish, keamanan, dan QA (sekitar 1 jam)
- Pemeriksaan XSS, URL, responsivitas 360 px, aksesibilitas keyboard, dan kontras.
- Cek konstanta WA dan kode dari secret.
- Definition of done: AC-26 sampai AC-30 lulus. Checklist rilis diisi.

---

## 12. Catatan Prototype (single HTML)

- Berkas: `laundry-zahra.html`. Dibuka langsung di browser tanpa server.
- Nomor WhatsApp: konstanta `WA_NUMBER` di bagian atas `<script>`. Nilai saat ini placeholder dan harus diganti.
- Storage key: `laundry-zahra:products:v1`.
- Tidak ada permintaan jaringan selain tautan WhatsApp saat diklik.
- Tema pink dan ilustrasi ditambahkan pada versi 0.2. Ilustrasi berupa SVG inline dan data URI yang dibuat di JavaScript.
