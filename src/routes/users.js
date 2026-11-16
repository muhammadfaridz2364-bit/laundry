import { Router } from 'express';
import { one, query } from '../db.js';
import { HttpError, route } from '../http.js';
import { requireRole } from '../auth.js';
import { mapUser } from '../mappers.js';

const router = Router();

const USER_SELECT = `SELECT u.id, u.nama, u.email, u.role, u.telepon, u.aktif, u.dibuat_pada,
  (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id) AS jumlah_produk
  FROM users u`;

router.get(
  '/',
  route(async (req, res) => {
    requireRole(req, 'admin');
    const rows = await query(`${USER_SELECT} ORDER BY u.id ASC`);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ users: rows.map(mapUser) });
  }),
);

router.patch(
  '/:id',
  route(async (req, res) => {
    const admin = requireRole(req, 'admin');
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) throw new HttpError(422, 'ID pengguna tidak valid.');

    const target = await one('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!target) throw new HttpError(404, 'Pengguna tidak ditemukan.');

    const role = req.body?.role === undefined ? target.role : String(req.body.role);
    const aktif = req.body?.aktif === undefined ? Boolean(target.aktif) : Boolean(req.body.aktif);

    if (!['admin', 'seller', 'buyer'].includes(role)) throw new HttpError(422, 'Peran tidak valid.');

    if (target.id === admin.id) {
      if (role !== 'admin') throw new HttpError(422, 'Tidak bisa menurunkan peran akun sendiri.');
      if (!aktif) throw new HttpError(422, 'Tidak bisa menonaktifkan akun sendiri.');
    }

    const losesAdmin = target.role === 'admin' && (role !== 'admin' || !aktif);
    if (losesAdmin) {
      const row = await one("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND aktif = 1 AND id <> ?", [
        target.id,
      ]);
      if (Number(row.total) === 0) throw new HttpError(422, 'Minimal harus ada satu admin aktif.');
    }

    await query('UPDATE users SET role = ?, aktif = ? WHERE id = ?', [role, aktif ? 1 : 0, target.id]);
    const updated = await one(`${USER_SELECT} WHERE u.id = ?`, [target.id]);
    res.json({ user: mapUser(updated) });
  }),
);

export default router;
