-- Skema database Laundry Zahra (MySQL 8).
-- Dijalankan otomatis oleh `npm run db:setup` setelah database dibuat.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'seller', 'buyer') NOT NULL DEFAULT 'buyer',
  telepon VARCHAR(30) NOT NULL DEFAULT '',
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(40) NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  nama VARCHAR(80) NOT NULL,
  kategori VARCHAR(40) NOT NULL,
  harga INT UNSIGNED NOT NULL,
  stok INT UNSIGNED NOT NULL DEFAULT 0,
  deskripsi VARCHAR(300) NOT NULL DEFAULT '',
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  unggulan TINYINT(1) NOT NULL DEFAULT 0,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_seller (seller_id),
  KEY idx_products_kategori (kategori),
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kode VARCHAR(24) NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(40) NULL,
  nama_produk VARCHAR(80) NOT NULL,
  jumlah INT UNSIGNED NOT NULL DEFAULT 1,
  harga_satuan INT UNSIGNED NOT NULL,
  total INT UNSIGNED NOT NULL,
  catatan VARCHAR(200) NOT NULL DEFAULT '',
  status ENUM('baru', 'diproses', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'baru',
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_kode (kode),
  KEY idx_orders_buyer (buyer_id),
  KEY idx_orders_seller (seller_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS settings (
  kunci VARCHAR(60) NOT NULL,
  nilai TEXT NOT NULL,
  diubah_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (kunci)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
