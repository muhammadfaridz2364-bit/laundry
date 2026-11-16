import process from 'node:process';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const appOrigin = (process.env.APP_ORIGIN ?? '').replace(/\/+$/, '');
const requestedPort = toInt(process.env.PORT, 3000);

export const config = Object.freeze({
  // PORT=0 (mis. dari environment CI) diabaikan agar server tetap memakai port normal.
  port: requestedPort > 0 ? requestedPort : 3000,
  appOrigin,
  secureCookies: appOrigin.startsWith('https://'),
  sessionSecret: process.env.SESSION_SECRET ?? '',
  db: Object.freeze({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'laundry_zahra',
    connectionLimit: toInt(process.env.DB_CONNECTION_LIMIT, 10),
  }),
});

if (config.sessionSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET wajib diisi minimal 32 karakter. Salin .env.example menjadi .env lalu isi nilainya.',
  );
}
