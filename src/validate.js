export function isSafeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Menerima string kosong, null, atau angka; selain itu NaN. */
function toNumber(raw) {
  if (raw === '' || raw === null || raw === undefined) return Number.NaN;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function toText(raw) {
  return typeof raw === 'string' ? raw.trim() : '';
}

export function validateProduct(body = {}) {
  const errors = [];
  const nama = toText(body.nama);
  const kategori = toText(body.kategori);
  const harga = toNumber(body.harga);
  const stok = toNumber(body.stok);
  const deskripsi = toText(body.deskripsi);
  const imageUrl = toText(body.imageUrl);
  const unggulan = body.unggulan === true || body.unggulan === 1 || body.unggulan === '1' || body.unggulan === 'true';

  if (nama.length < 2 || nama.length > 80) errors.push('Nama 2–80 karakter.');
  if (kategori.length < 1 || kategori.length > 40) errors.push('Kategori wajib diisi, maks 40 karakter.');
  if (!Number.isInteger(harga) || harga < 0) errors.push('Harga harus angka ≥ 0.');
  if (!Number.isInteger(stok) || stok < 0) errors.push('Stok harus bilangan bulat ≥ 0.');
  if (deskripsi.length > 300) errors.push('Deskripsi maks 300 karakter.');
  if (imageUrl !== '' && !isSafeUrl(imageUrl)) errors.push('URL gambar harus http/https atau kosong.');

  return { errors, value: { nama, kategori, harga, stok, deskripsi, imageUrl, unggulan } };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegistration(body = {}) {
  const errors = [];
  const nama = toText(body.nama);
  const email = toText(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const role = toText(body.role) || 'buyer';
  const telepon = toText(body.telepon);

  if (nama.length < 2 || nama.length > 80) errors.push('Nama 2–80 karakter.');
  if (email.length > 190 || !EMAIL_RE.test(email)) errors.push('Email tidak valid.');
  if (password.length < 8 || password.length > 100) errors.push('Password 8–100 karakter.');
  if (!['buyer', 'seller'].includes(role)) errors.push('Peran harus pembeli atau penjual.');
  if (telepon.length > 30) errors.push('Telepon maks 30 karakter.');

  return { errors, value: { nama, email, password, role, telepon } };
}

export function normalizeWa(raw) {
  let value = String(raw ?? '').replace(/[\s\-().]/g, '');
  if (value.startsWith('+')) value = value.slice(1);
  if (value.startsWith('0')) value = `62${value.slice(1)}`;
  return value;
}

export const WA_RE = /^62\d{8,13}$/;
