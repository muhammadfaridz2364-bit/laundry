import crypto from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };
const ALGORITHM = 'scrypt';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, PARAMS.keylen, PARAMS);
  return [ALGORITHM, PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), derived.toString('base64url')].join('$');
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64url');
  if (expected.length === 0) return false;

  try {
    const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64url'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: PARAMS.maxmem,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function randomPassword(prefix = 'LZ') {
  return `${prefix}#${crypto.randomBytes(9).toString('base64url')}9a`;
}
