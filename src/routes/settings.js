import { Router } from 'express';
import { HttpError, route } from '../http.js';
import { requireRole } from '../auth.js';
import { getSetting, setSetting } from '../settings-store.js';
import { normalizeWa, WA_RE } from '../validate.js';
import { DEFAULT_TEMPLATE, DEFAULT_WA } from '../wa.js';

const router = Router();

const MAX_TEMPLATE = 500;

async function currentSettings() {
  return {
    waNumber: await getSetting('wa_number', DEFAULT_WA),
    waTemplate: await getSetting('wa_template', DEFAULT_TEMPLATE),
  };
}

router.get(
  '/',
  route(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await currentSettings());
  }),
);

router.put(
  '/',
  route(async (req, res) => {
    requireRole(req, 'admin');

    const next = {};

    if (req.body?.waNumber !== undefined) {
      const number = normalizeWa(req.body.waNumber);
      if (!WA_RE.test(number)) {
        throw new HttpError(422, 'Nomor tidak valid. Gunakan format 08xxx atau 62xxx, 10–15 digit.');
      }
      next.waNumber = number;
    }

    if (req.body?.waTemplate !== undefined) {
      const template = String(req.body.waTemplate).replace(/\r\n/g, '\n').trim();
      if (!template) throw new HttpError(422, 'Template pesan tidak boleh kosong.');
      if (template.length > MAX_TEMPLATE) {
        throw new HttpError(422, `Template pesan maksimal ${MAX_TEMPLATE} karakter.`);
      }
      next.waTemplate = template;
    }

    if (!Object.keys(next).length) throw new HttpError(422, 'Tidak ada perubahan yang dikirim.');

    if (next.waNumber !== undefined) await setSetting('wa_number', next.waNumber);
    if (next.waTemplate !== undefined) await setSetting('wa_template', next.waTemplate);

    res.json(await currentSettings());
  }),
);

export default router;
