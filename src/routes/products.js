import crypto from 'node:crypto';
import { Router } from 'express';
import { one, query } from '../db.js';
import { HttpError, route } from '../http.js';
import { requireRole, requireUser } from '../auth.js';
import { mapProduct } from '../mappers.js';
import { validateProduct } from '../validate.js';

const router = Router();

const SORTS = {
  'name-asc': 'p.nama ASC',
  'price-asc': 'p.harga ASC, p.nama ASC',
  'price-desc': 'p.harga DESC, p.nama ASC',
  'stock-desc': 'p.stok DESC, p.nama ASC',
};

const newProductId = () =>
  `p-${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`.slice(0, 40);

async function findProduct(id) {
  return one('SELECT p.*, u.nama AS penjual FROM products p JOIN users u ON u.id = p.seller_id WHERE p.id = ?', [
    id,
  ]);
}

function assertCanManage(user, product) {
  if (user.role === 'admin') return;
  if (Number(product.seller_id) !== user.id) {
    throw new HttpError(403, 'Anda hanya bisa mengelola produk milik sendiri.');
  }
}

router.get(
  '/',
  route(async (req, res) => {
    const conditions = [];
    const params = [];
    const mine = req.query.mine === '1';

    if (mine) {
      const user = requireUser(req);
      conditions.push('p.seller_id = ?');
      params.push(user.id);
    }

    const kategori = String(req.query.kategori ?? '').trim();
    if (kategori) {
      conditions.push('p.kategori = ?');
      params.push(kategori);
    }

    const term = String(req.query.q ?? '').trim();
    if (term) {
      conditions.push('(p.nama LIKE ? OR p.deskripsi LIKE ?)');
      params.push(`%${term}%`, `%${term}%`);
    }

    const sortKey = Object.hasOwn(SORTS, String(req.query.sort)) ? String(req.query.sort) : 'name-asc';
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await query(
      `SELECT p.*, u.nama AS penjual FROM products p JOIN users u ON u.id = p.seller_id
       ${where} ORDER BY ${SORTS[sortKey]}, p.id ASC`,
      params,
    );

    const categoryRows = await query(
      `SELECT DISTINCT p.kategori FROM products p JOIN users u ON u.id = p.seller_id
       ${mine ? 'WHERE p.seller_id = ?' : ''} ORDER BY p.kategori ASC`,
      mine ? [params[0]] : [],
    );

    res.setHeader('Cache-Control', 'no-store');
    res.json({ products: rows.map(mapProduct), categories: categoryRows.map((row) => row.kategori) });
  }),
);

router.post(
  '/',
  route(async (req, res) => {
    const user = requireRole(req, 'seller', 'admin');
    const { errors, value } = validateProduct(req.body);
    if (errors.length) throw new HttpError(422, errors.join(' '));

    let sellerId = user.id;
    if (user.role === 'admin') {
      const requested = Number(req.body?.sellerId);
      if (Number.isInteger(requested) && requested > 0) {
        const seller = await one('SELECT id FROM users WHERE id = ? AND role = ? AND aktif = 1', [
          requested,
          'seller',
        ]);
        if (!seller) throw new HttpError(422, 'Penjual tidak ditemukan.');
        sellerId = seller.id;
      }
    }

    const id = newProductId();
    await query(
      `INSERT INTO products (id, seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sellerId, value.nama, value.kategori, value.harga, value.stok, value.deskripsi, value.imageUrl, value.unggulan ? 1 : 0],
    );

    res.status(201).json({ product: mapProduct(await findProduct(id)) });
  }),
);

router.put(
  '/:id',
  route(async (req, res) => {
    const user = requireRole(req, 'seller', 'admin');
    const existing = await findProduct(req.params.id);
    if (!existing) throw new HttpError(404, 'Produk tidak ditemukan.');
    assertCanManage(user, existing);

    const { errors, value } = validateProduct(req.body);
    if (errors.length) throw new HttpError(422, errors.join(' '));

    let sellerId = Number(existing.seller_id);
    if (user.role === 'admin' && req.body?.sellerId !== undefined) {
      const requested = Number(req.body.sellerId);
      if (!Number.isInteger(requested) || requested <= 0) {
        throw new HttpError(422, 'Penjual tidak valid.');
      }
      const seller = await one('SELECT id FROM users WHERE id = ? AND role = ? AND aktif = 1', [
        requested,
        'seller',
      ]);
      if (!seller) throw new HttpError(422, 'Penjual tidak ditemukan.');
      sellerId = seller.id;
    }

    await query(
      `UPDATE products SET seller_id = ?, nama = ?, kategori = ?, harga = ?, stok = ?,
       deskripsi = ?, image_url = ?, unggulan = ? WHERE id = ?`,
      [sellerId, value.nama, value.kategori, value.harga, value.stok, value.deskripsi, value.imageUrl, value.unggulan ? 1 : 0, existing.id],
    );

    res.json({ product: mapProduct(await findProduct(existing.id)) });
  }),
);

router.delete(
  '/:id',
  route(async (req, res) => {
    const user = requireRole(req, 'seller', 'admin');
    const existing = await findProduct(req.params.id);
    if (!existing) throw new HttpError(404, 'Produk tidak ditemukan.');
    assertCanManage(user, existing);

    await query('DELETE FROM products WHERE id = ?', [existing.id]);
    res.status(204).end();
  }),
);

export default router;
