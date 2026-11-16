import { one, query } from './db.js';

export async function getSetting(key, fallback = '') {
  const row = await one('SELECT nilai FROM settings WHERE kunci = ?', [key]);
  return row ? row.nilai : fallback;
}

export async function setSetting(key, value) {
  await query(
    'INSERT INTO settings (kunci, nilai) VALUES (?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)',
    [key, value],
  );
}
