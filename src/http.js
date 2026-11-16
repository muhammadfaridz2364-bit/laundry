import { config } from './config.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/**
 * Semua perubahan data memakai JSON + cookie SameSite=Lax. Pemeriksaan Origin
 * menutup celah CSRF untuk permintaan lintas situs yang membawa cookie.
 */
export function sameOriginOnly(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  const host = req.headers.host;
  const allowed = new Set([`http://${host}`, `https://${host}`, config.appOrigin].filter(Boolean));
  if (!allowed.has(origin)) {
    return next(new HttpError(403, 'Permintaan ditolak: origin tidak diizinkan.'));
  }
  return next();
}

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error instanceof HttpError ? error.status : 500;
  let message = error instanceof HttpError ? error.message : 'Terjadi kesalahan pada server.';

  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Format JSON tidak valid.';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Permintaan terlalu besar.';
  }

  if (status >= 500) console.error('[server]', error);
  res.status(status).json({ error: message });
}
