export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

export const SHOP_NAME = 'Laundry Zahra';

const MESSAGE_PLACEHOLDER = /\{(toko|produk|jumlah|total|kode|catatan)\}/g;

const messageValue = (values, key) => String(values[key] ?? '').trim();

/** Nilai kosong atau "-" membuat baris template dibuang (sama dengan sisi server). */
const messageUsable = (value) => value !== '' && value !== '-';

/**
 * Mengisi placeholder template pesan dan menghapus baris yang placeholder-nya
 * tidak punya nilai, mis. "Kode pesanan: -" pada tautan cepat katalog.
 */
export function renderMessage(template, values = {}) {
  return String(template ?? '')
    .trim()
    .split('\n')
    .filter((line) =>
      [...line.matchAll(MESSAGE_PLACEHOLDER)].every((match) =>
        messageUsable(messageValue(values, match[1])),
      ),
    )
    .map((line) => line.replace(MESSAGE_PLACEHOLDER, (match, key) => messageValue(values, key)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const rupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  );

export function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatDate(value) {
  if (!value) return '–';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export const roleLabel = (role) =>
  ({ admin: 'Admin', seller: 'Penjual', buyer: 'Pembeli' })[role] ?? role;

export const statusLabel = (status) =>
  ({ baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai', dibatalkan: 'Dibatalkan' })[status] ?? status;

/* ===== Ilustrasi SVG buatan sendiri, tanpa aset eksternal ===== */
const ART = {
  washer: `
    <rect x="92" y="18" width="136" height="118" rx="20" fill="#fff" stroke="#be185d" stroke-width="4"/>
    <rect x="108" y="32" width="104" height="16" rx="6" fill="#fbcfe8"/>
    <circle cx="234" cy="40" r="5" fill="#db2777"/>
    <circle cx="160" cy="92" r="36" fill="#f9a8d4" stroke="#be185d" stroke-width="4"/>
    <circle cx="160" cy="92" r="20" fill="#fdf2f8" stroke="#db2777" stroke-width="3"/>
    <path d="M150 84 Q160 74 170 84" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="52" cy="52" r="10" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="40" cy="100" r="7" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="278" cy="112" r="12" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="268" cy="62" r="6" fill="#fff" stroke="#f472b6" stroke-width="2"/>`,
  express: `
    <rect x="92" y="18" width="136" height="118" rx="20" fill="#fff" stroke="#be185d" stroke-width="4"/>
    <rect x="108" y="32" width="104" height="16" rx="6" fill="#fbcfe8"/>
    <circle cx="160" cy="92" r="36" fill="#f9a8d4" stroke="#be185d" stroke-width="4"/>
    <circle cx="160" cy="92" r="20" fill="#fdf2f8" stroke="#db2777" stroke-width="3"/>
    <circle cx="282" cy="36" r="20" fill="#be185d"/>
    <path d="M282 24 V36 L290 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="52" cy="52" r="10" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="40" cy="110" r="7" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
  iron: `
    <path d="M140 40 Q132 30 140 20 M168 40 Q160 30 168 20" fill="none" stroke="#f472b6" stroke-width="3" stroke-linecap="round"/>
    <path d="M84 98 Q84 74 118 74 L206 74 Q242 74 244 98 L244 108 L84 108 Z" fill="#fff" stroke="#be185d" stroke-width="4" stroke-linejoin="round"/>
    <path d="M84 108 H244 V116 Q244 122 238 122 H90 Q84 122 84 116 Z" fill="#db2777"/>
    <path d="M100 74 Q112 52 146 58" fill="none" stroke="#be185d" stroke-width="5" stroke-linecap="round"/>
    <path d="M110 90 H200" stroke="#f9a8d4" stroke-width="4" stroke-linecap="round"/>
    <circle cx="52" cy="60" r="10" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="268" cy="104" r="8" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
  jacket: `
    <path d="M160 30 Q160 18 172 20 Q180 24 172 34 Q166 40 160 46" fill="none" stroke="#be185d" stroke-width="4" stroke-linecap="round"/>
    <path d="M160 46 L118 70 M160 46 L202 70" stroke="#be185d" stroke-width="4" stroke-linecap="round"/>
    <path d="M118 76 L140 70 L180 70 L202 76 L198 136 L122 136 Z" fill="#fff" stroke="#be185d" stroke-width="4" stroke-linejoin="round"/>
    <path d="M160 70 V136" stroke="#f472b6" stroke-width="3"/>
    <circle cx="140" cy="100" r="2.5" fill="#db2777"/><circle cx="140" cy="116" r="2.5" fill="#db2777"/>
    <path d="M262 40 L266 50 L276 54 L266 58 L262 68 L258 58 L248 54 L258 50 Z" fill="#f472b6"/>`,
  blanket: `
    <rect x="88" y="34" width="144" height="96" rx="16" fill="#fff" stroke="#be185d" stroke-width="4"/>
    <path d="M100 58 H220 M100 78 H220 M100 98 H220 M100 118 H220" stroke="#f9a8d4" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="60" r="10" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="272" cy="112" r="8" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
  shoe: `
    <path d="M78 110 V84 Q78 74 92 78 L120 90 Q138 98 160 96 L238 96 Q256 98 256 112 V116 H78 Z" fill="#fff" stroke="#be185d" stroke-width="4" stroke-linejoin="round"/>
    <path d="M78 108 H256 V116 H78 Z" fill="#db2777"/>
    <path d="M104 88 L118 96 M126 92 L140 100" stroke="#f472b6" stroke-width="4" stroke-linecap="round"/>
    <circle cx="44" cy="70" r="9" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="276" cy="78" r="6" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
  bottle: `
    <rect x="142" y="26" width="36" height="16" rx="4" fill="#be185d"/>
    <path d="M132 42 H188 Q196 42 196 52 V122 Q196 132 186 132 H134 Q124 132 124 122 V52 Q124 42 132 42 Z" fill="#f9a8d4" stroke="#be185d" stroke-width="4"/>
    <rect x="134" y="74" width="52" height="34" rx="6" fill="#fff"/>
    <path d="M144 90 H176 M144 98 H170" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
    <circle cx="258" cy="60" r="8" fill="#fff" stroke="#f472b6" stroke-width="3"/>
    <circle cx="60" cy="110" r="10" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
  bag: `
    <path d="M108 62 H212 L222 130 Q222 138 214 138 H106 Q98 138 98 130 Z" fill="#fff" stroke="#be185d" stroke-width="4" stroke-linejoin="round"/>
    <path d="M134 62 Q134 34 160 34 Q186 34 186 62" fill="none" stroke="#be185d" stroke-width="4"/>
    <rect x="104" y="84" width="112" height="10" fill="#f9a8d4"/>
    <path d="M120 106 H200" stroke="#f472b6" stroke-width="3" stroke-dasharray="6 6"/>
    <circle cx="268" cy="54" r="8" fill="#fff" stroke="#f472b6" stroke-width="3"/>`,
};

/* ===== Foto produk: aset lokal di public/img/products (Pexels, lisensi bebas pakai) ===== */
const APP_BASE = new URL('../', import.meta.url);
const assetUrl = (path) => new URL(path, APP_BASE).href;

const PHOTO = {
  washer: assetUrl('img/products/washer.jpg'),
  'washer-clothes': assetUrl('img/products/washer-clothes.jpg'),
  ironing: assetUrl('img/products/ironing.jpg'),
  folded: assetUrl('img/products/folded.jpg'),
  bedding: assetUrl('img/products/bedding.jpg'),
  hangers: assetUrl('img/products/hangers.jpg'),
  pillows: assetUrl('img/products/pillows.jpg'),
  curtain: assetUrl('img/products/curtain.jpg'),
  carpet: assetUrl('img/products/carpet.jpg'),
  sneakers: assetUrl('img/products/sneakers.jpg'),
  tote: assetUrl('img/products/tote.jpg'),
  teddy: assetUrl('img/products/teddy.jpg'),
  detergent: assetUrl('img/products/detergent.jpg'),
  'detergent-pour': assetUrl('img/products/detergent-pour.jpg'),
};

/** Memilih foto yang paling cocok dari nama dan kategori produk. */
function photoKey(product) {
  const name = String(product?.nama ?? '').toLowerCase();
  const kategori = String(product?.kategori ?? '').toLowerCase();
  if (name.includes('boneka')) return 'teddy';
  if (name.includes('sepatu')) return 'sneakers';
  if (name.includes('karpet')) return 'carpet';
  if (name.includes('tas')) return 'tote';
  if (name.includes('gorden')) return 'curtain';
  if (name.includes('bantal') || name.includes('guling')) return 'pillows';
  if (name.includes('selimut') || name.includes('bed cover') || name.includes('bedcover')) return 'bedding';
  if (name.includes('jas') || name.includes('blazer') || name.includes('dry clean')) return 'hangers';
  if (name.includes('hanger')) return 'hangers';
  if (name.includes('setrika')) return 'ironing';
  if (name.includes('kemeja') || name.includes('seragam') || name.includes('jaket')) return 'hangers';
  if (name.includes('hoodie') || name.includes('sweater') || name.includes('rajut')) return 'hangers';
  if (name.includes('seprai') || name.includes('sprei')) return 'bedding';
  if (name.includes('handuk')) return 'folded';
  if (name.includes('jeans') || name.includes('celana')) return 'folded';
  if (name.includes('detergen')) return 'detergent';
  if (name.includes('pewangi') || name.includes('pelembut')) return 'detergent-pour';
  if (name.includes('express') || name.includes('jam')) return 'washer-clothes';
  if (name.includes('lipat') || name.includes('kering')) return 'folded';
  if (name.includes('kantong') || name.includes('jaring') || name.includes('sikat')) return 'detergent';
  if (name.includes('cuci')) return 'washer';
  if (kategori === 'perlengkapan') return 'detergent';
  if (kategori === 'perawatan khusus') return 'folded';
  return 'washer';
}

export const photoFor = (product) => PHOTO[photoKey(product)];

const svgWrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="150" viewBox="0 0 320 150"><rect width="320" height="150" fill="#fce7f3"/>${inner}</svg>`;

const svgUri = (inner) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWrap(inner))}`;

function artKey(product) {
  const name = String(product?.nama ?? '').toLowerCase();
  if (name.includes('express') || name.includes('6 jam')) return 'express';
  if (name.includes('setrika saja')) return 'iron';
  if (name.includes('setrika')) return 'washer';
  if (name.includes('jas') || name.includes('dry')) return 'jacket';
  if (name.includes('selimut')) return 'blanket';
  if (name.includes('sepatu')) return 'shoe';
  if (name.includes('pewangi')) return 'bottle';
  if (name.includes('kantong') || name.includes('zip')) return 'bag';
  if (product?.kategori === 'Perlengkapan') return 'bottle';
  if (product?.kategori === 'Perawatan Khusus') return 'jacket';
  return 'washer';
}

export const illustrationFor = (product) => photoFor(product) || svgUri(ART[artKey(product)]);

export function placeholderFor(name) {
  const initials =
    String(name ?? '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('') || '?';
  return svgUri(
    `<circle cx="160" cy="75" r="40" fill="#f9a8d4"/><text x="160" y="75" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#831843">${esc(
      initials.toUpperCase(),
    )}</text>`,
  );
}

export const heroArt = () =>
  `<img src="${PHOTO.washer}" alt="Mesin cuci di laundromat" width="220" height="165" loading="eager">`;
