import { Router } from 'express';
import { one, query } from '../db.js';
import { HttpError, route } from '../http.js';
import { destroySession, issueSession } from '../auth.js';
import { hashPassword, verifyPassword } from '../password.js';
import { mapUser } from '../mappers.js';
import { validateRegistration } from '../validate.js';

const router = Router();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map();

function isBlocked(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(key, { first: Date.now(), count: 1 });
    return;
  }
  entry.count += 1;
}

const USER_FIELDS = 'id, nama, email, role, telepon, aktif, dibuat_pada';

router.post(
  '/register',
  route(async (req, res) => {
    const { errors, value } = validateRegistration(req.body);
    if (errors.length) throw new HttpError(422, errors.join(' '));

    const existing = await one('SELECT id FROM users WHERE email = ?', [value.email]);
    if (existing) throw new HttpError(409, 'Email sudah terdaftar.');

    let result;
    try {
      result = await query(
        'INSERT INTO users (nama, email, password_hash, role, telepon) VALUES (?, ?, ?, ?, ?)',
        [value.nama, value.email, hashPassword(value.password), value.role, value.telepon],
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Email sudah terdaftar.');
      throw error;
    }

    const row = await one(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [result.insertId]);
    issueSession(res, row.id);
    res.status(201).json({ user: mapUser(row) });
  }),
);

router.post(
  '/login',
  route(async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const key = `${req.ip}|${email}`;

    if (isBlocked(key)) {
      throw new HttpError(429, 'Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.');
    }

    const row = await one('SELECT * FROM users WHERE email = ?', [email]);
    if (!row || !verifyPassword(password, row.password_hash)) {
      recordFailure(key);
      throw new HttpError(401, 'Email atau password salah.');
    }
    if (!row.aktif) throw new HttpError(403, 'Akun Anda dinonaktifkan. Hubungi admin.');

    attempts.delete(key);
    issueSession(res, row.id);
    res.json({ user: mapUser(row) });
  }),
);

router.post('/logout', (req, res) => {
  destroySession(res);
  res.status(204).end();
});

router.get('/me', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ user: req.user ?? null });
});

export default router;
