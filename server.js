import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from './src/config.js';
import { attachUser } from './src/auth.js';
import { errorHandler, sameOriginOnly, securityHeaders } from './src/http.js';
import { pool } from './src/db.js';
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import orderRoutes from './src/routes/orders.js';
import userRoutes from './src/routes/users.js';
import settingRoutes from './src/routes/settings.js';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, 'public');

const app = express();
app.disable('x-powered-by');

app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(attachUser);
app.use('/api', sameOriginOnly);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use(express.static(publicDir, { extensions: ['html'], index: 'index.html' }));
app.get('*', (req, res) => {
  res.sendFile(join(here, 'index.html'));
});

app.use(errorHandler);

try {
  await pool.query('SELECT 1');
  console.log(`✓ Terhubung ke MySQL ${config.db.host}:${config.db.port}/${config.db.database}`);
} catch (error) {
  console.error('✗ Gagal terhubung ke MySQL:', error.message);
  console.error('  Halaman tetap tersedia, tetapi fitur yang memakai database perlu DB_* yang valid di .env.');
}

const server = app.listen(config.port, () => {
  console.log(`Laundry Zahra berjalan di http://localhost:${config.port}`);
});

const shutdown = (signal) => {
  console.log(`\n${signal}: menutup server...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
