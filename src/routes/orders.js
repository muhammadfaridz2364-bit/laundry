import crypto from 'node:crypto';
import { Router } from 'express';
import { one, query } from '../db.js';
import { HttpError, route } from '../http.js';
import { requireRole, requireUser } from '../auth.js';
import { mapOrder } from '../mappers.js';
import { getSetting } from '../settings-store.js';
import { buildWaLink, DEFAULT_TEMPLATE, DEFAULT_WA } from '../wa.js';

const router = Router();

const ORDER_SELECT = `SELECT o.*, b.nama AS pembeli, s.nama AS penjual
  FROM orders o
  JOIN users b ON b.id = o.buyer_id
  JOIN users s ON s.id = o.seller_id`;

const STATUSES = ['baru', 'diproses', 'selesai', 'dibatalkan'];

router.post(
  '/',
  route(async (req, res) => {
    const user = requireRole(req, 'buyer');
    const productId = String(req.body?.productId ?? '').trim();
    const jumlah = Number(req.body?.jumlah);
    const catatan = String(req.body?.catatan ?? '').trim();

    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 99) {
      throw new HttpError(422, 'Jumlah harus bilangan bulat 1–99.');
    }
    if (catatan.length > 200) throw new HttpError(422, 'Catatan maksimal 200 karakter.');

    const product = await one('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) throw new HttpError(404, 'Produk tidak ditemukan.');
    if (product.stok <= 0) throw new HttpError(409, 'Stok produk sedang habis.');
    if (jumlah > product.stok) throw new HttpError(409, `Stok tersedia hanya ${product.stok}.`);

    const total = Number(product.harga) * jumlah;
    const kode = `LZ-${Date.now().toString(36).toUpperCase()}${crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;

    const result = await query(
      `INSERT INTO orders (kode, buyer_id, seller_id, product_id, nama_produk, jumlah, harga_satuan, total, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kode, user.id, product.seller_id, product.id, product.nama, jumlah, product.harga, total, catatan],
    );

    const row = await one(`${ORDER_SELECT} WHERE o.id = ?`, [result.insertId]);
    const waNumber = await getSetting('wa_number', DEFAULT_WA);
    const template = await getSetting('wa_template', DEFAULT_TEMPLATE);
    const order = mapOrder(row);

    res.status(201).json({ order, waUrl: buildWaLink(waNumber, order, template) });
  }),
);

router.get(
  '/',
  route(async (req, res) => {
    const user = requireUser(req);

    const conditions = [];
    const params = [];
    if (user.role === 'buyer') {
      conditions.push('o.buyer_id = ?');
      params.push(user.id);
    } else if (user.role === 'seller') {
      conditions.push('o.seller_id = ?');
      params.push(user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query(`${ORDER_SELECT} ${where} ORDER BY o.id DESC`, params);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ orders: rows.map(mapOrder) });
  }),
);

router.patch(
  '/:id/status',
  route(async (req, res) => {
    const user = requireRole(req, 'seller', 'admin');
    const status = String(req.body?.status ?? '');
    if (!STATUSES.includes(status)) throw new HttpError(422, 'Status pesanan tidak valid.');

    const order = await one('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) throw new HttpError(404, 'Pesanan tidak ditemukan.');
    if (user.role === 'seller' && Number(order.seller_id) !== user.id) {
      throw new HttpError(403, 'Anda hanya bisa mengubah pesanan produk sendiri.');
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    const row = await one(`${ORDER_SELECT} WHERE o.id = ?`, [order.id]);
    res.json({ order: mapOrder(row) });
  }),
);

export default router;
