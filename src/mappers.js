export function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    nama: row.nama,
    email: row.email,
    role: row.role,
    telepon: row.telepon ?? '',
    aktif: Boolean(row.aktif),
    jumlahProduk: row.jumlah_produk === undefined ? undefined : Number(row.jumlah_produk),
    dibuatPada: row.dibuat_pada ?? null,
  };
}

export function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    sellerId: Number(row.seller_id),
    penjual: row.penjual ?? '',
    nama: row.nama,
    kategori: row.kategori,
    harga: Number(row.harga),
    stok: Number(row.stok),
    deskripsi: row.deskripsi ?? '',
    imageUrl: row.image_url ?? '',
    unggulan: Boolean(row.unggulan),
    dibuatPada: row.dibuat_pada ?? null,
  };
}

export function mapOrder(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    kode: row.kode,
    buyerId: Number(row.buyer_id),
    sellerId: Number(row.seller_id),
    productId: row.product_id ?? null,
    namaProduk: row.nama_produk,
    jumlah: Number(row.jumlah),
    hargaSatuan: Number(row.harga_satuan),
    total: Number(row.total),
    catatan: row.catatan ?? '',
    status: row.status,
    pembeli: row.pembeli ?? '',
    penjual: row.penjual ?? '',
    dibuatPada: row.dibuat_pada ?? null,
  };
}
