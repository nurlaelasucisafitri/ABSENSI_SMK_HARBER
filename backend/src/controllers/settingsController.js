import pool from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { uploadsRoot } from '../middleware/upload.js';

export async function getGeneralSettings(req, res) {
  try {
    const [[row]] = await pool.query('SELECT * FROM general_settings LIMIT 1');
    res.json({ success: true, data: row || {} });
  } catch (err) {
    console.error('getGeneralSettings error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan.' });
  }
}

export async function updateGeneralSettings(req, res) {
  try {
    const { school_name, school_year, copyright } = req.body;
    const errors = {};

    if (!school_name || school_name.length > 200) errors.school_name = 'Nama sekolah harus diisi (maks. 200 karakter).';
    if (!school_year || school_year.length > 200) errors.school_year = 'Tahun ajaran harus diisi (maks. 200 karakter).';
    if (copyright && copyright.length > 200) errors.copyright = 'Copyright maks. 200 karakter.';

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: 'Validasi gagal.', errors });
    }

    const [[existing]] = await pool.query('SELECT * FROM general_settings LIMIT 1');

    let logo = existing?.logo || null;
    if (req.file) {
      logo = `uploads/logo/${req.file.filename}`;
      if (existing?.logo) {
        const oldPath = path.join(process.cwd(), existing.logo.replace('uploads/', 'uploads/'));
        const fullOld = path.join(uploadsRoot, existing.logo.replace(/^uploads\//, ''));
        if (fs.existsSync(fullOld)) fs.unlinkSync(fullOld);
      }
    }

    if (existing) {
      await pool.query('UPDATE general_settings SET logo=?, school_name=?, school_year=?, copyright=? WHERE id=?', [
        logo, school_name, school_year, copyright || existing.copyright, existing.id,
      ]);
    } else {
      await pool.query('INSERT INTO general_settings (logo, school_name, school_year, copyright) VALUES (?, ?, ?, ?)', [
        logo, school_name, school_year, copyright || '© 2025 All rights reserved.',
      ]);
    }

    res.json({ success: true, message: 'Data berhasil diubah.' });
  } catch (err) {
    console.error('updateGeneralSettings error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah pengaturan.' });
  }
}
