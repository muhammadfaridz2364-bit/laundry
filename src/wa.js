export const DEFAULT_WA = '6200000000000';
export const SHOP_NAME = 'Laundry Zahra';

export const DEFAULT_TEMPLATE = [
  'Halo *{toko}*, saya ingin memesan:',
  '• {produk} × {jumlah}',
  '• Total: {total}',
  'Kode pesanan: {kode}',
  'Catatan: {catatan}',
  '',
  'Apakah pesanan saya bisa diproses?',
].join('\n');

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

const PLACEHOLDER = /\{(toko|produk|jumlah|total|kode|catatan)\}/g;

const valueOf = (values, key) => String(values[key] ?? '').trim();

/** Nilai kosong atau tanda "-" berarti barisnya tidak berguna, jadi dibuang. */
const isUsable = (value) => value !== '' && value !== '-';

/**
 * Mengganti placeholder {toko} {produk} {jumlah} {total} {kode} {catatan}.
 * Baris yang memuat placeholder tanpa nilai (mis. "Kode pesanan: -") dihapus,
 * sehingga pesan tidak menampilkan baris kosong yang janggal.
 */
export function renderTemplate(template, values = {}) {
  const source = String(template ?? '').trim() || DEFAULT_TEMPLATE;
  const lines = source
    .split('\n')
    .filter((line) =>
      [...line.matchAll(PLACEHOLDER)].every((match) => isUsable(valueOf(values, match[1]))),
    )
    .map((line) => line.replace(PLACEHOLDER, (match, key) => valueOf(values, key)));

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function buildWaLink(waNumber, order, template = DEFAULT_TEMPLATE) {
  const text = renderTemplate(template, {
    toko: SHOP_NAME,
    produk: order.namaProduk,
    jumlah: order.jumlah,
    total: formatRupiah(order.total),
    kode: order.kode,
    catatan: String(order.catatan ?? '').trim() || '-',
  });
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}
