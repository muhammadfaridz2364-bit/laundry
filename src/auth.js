import crypto from 'node:crypto';
import { config } from './config.js';
import { one } from './db.js';
import { HttpError } from './http.js';
import { mapUser } from './mappers.js';

const COOKIE_NAME = 'lz_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const toBase64Url = (value) => Buffer.from(value).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', config.sessionSecret).update(payload).digest('base64url');

function equal(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(header = '') {
  return String(header)
    .split(';')
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;
      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (name) acc[name] = decodeURIComponent(value);
      return acc;
    }, {});
}

export function issueSession(res, userId) {
  const payload = toBase64Url(JSON.stringify({ uid: Number(userId), exp: Date.now() + SESSION_TTL_MS }));
  const token = `${payload}.${sign(payload)}`;
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    config.secureCookies ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.append('Set-Cookie', cookie);
}

export function destroySession(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    config.secureCookies ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.append('Set-Cookie', cookie);
}

function readSession(raw) {
  if (!raw) return null;
  const [payload, signature] = String(raw).split('.');
  if (!payload || !signature) return null;
  if (!equal(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(data.uid) || !Number.isFinite(data.exp) || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function attachUser(req, res, next) {
  try {
    const session = readSession(parseCookies(req.headers.cookie ?? '')[COOKIE_NAME]);
    if (session) {
      const row = await one(
        'SELECT id, nama, email, role, telepon, aktif, dibuat_pada FROM users WHERE id = ?',
        [session.uid],
      );
      if (row && row.aktif) req.user = mapUser(row);
    }
  } catch (error) {
    console.error('[auth] gagal memuat sesi:', error.message);
  }
  next();
}

export function requireUser(req) {
  if (!req.user) throw new HttpError(401, 'Silakan masuk terlebih dahulu.');
  return req.user;
}

export function requireRole(req, ...roles) {
  const user = requireUser(req);
  if (!roles.includes(user.role)) throw new HttpError(403, 'Anda tidak memiliki akses ke fitur ini.');
  return user;
}
