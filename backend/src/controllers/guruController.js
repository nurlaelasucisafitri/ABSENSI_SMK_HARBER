import pool from '../config/db.js';
import { generateToken } from '../utils/token.js';

export async function listGuru(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM tb_guru ORDER BY nama_guru');
    res.json({ success: true, data: rows, empty: rows.length === 0 });
  } catch (err) {
    console.error('listGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data guru.' });
  }
}

export async function getGuruById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM tb_guru WHERE id_guru = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getGuruById error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
}

function validateGuruInput(body) {
  const errors = {};
  if (!body.nuptk || body.nuptk.length < 16 || body.nuptk.length > 20) {
    errors.nuptk = 'NUPTK harus diisi (16-20 karakter).';
  }
  if (!body.nama || body.nama.trim().length < 3) {
    errors.nama = 'Nama harus diisi minimal 3 karakter.';
  }
  if (!body.jk) {
    errors.jk = 'Jenis kelamin wajib diisi.';
  }
  if (!body.alamat || body.alamat.trim().length === 0) {
    errors.alamat = 'Alamat harus diisi.';
  }
  if (!body.no_hp || !/^\d{5,20}$/.test(body.no_hp)) {
    errors.no_hp = 'No HP harus diisi, hanya angka (5-20 digit).';
  }
  return errors;
}

export async function createGuru(req, res) {
  try {
    const errors = validateGuruInput(req.body);

    const [[dup]] = await pool.query('SELECT id_guru FROM tb_guru WHERE nuptk = ?', [req.body.nuptk]);
    if (dup) errors.nuptk = 'NUPTK ini telah terdaftar.';

    if (req.body.rfid) {
      const [[dupRfid]] = await pool.query('SELECT id_guru FROM tb_guru WHERE rfid_code = ?', [req.body.rfid]);
      if (dupRfid) errors.rfid = 'RFID code sudah digunakan.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: 'Validasi gagal.', errors });
    }

    const uniqueCode = generateToken();
    const [result] = await pool.query(
      `INSERT INTO tb_guru (nuptk, nama_guru, jenis_kelamin, alamat, no_hp, unique_code, rfid_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.body.nuptk, req.body.nama, req.body.jk, req.body.alamat, req.body.no_hp, uniqueCode, req.body.rfid || null]
    );

    res.json({ success: true, message: 'Tambah data berhasil.', id: result.insertId });
  } catch (err) {
    console.error('createGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambah data.' });
  }
}

export async function updateGuru(req, res) {
  try {
    const id = req.body.id || req.params.id;
    const errors = validateGuruInput(req.body);

    const [[existing]] = await pool.query('SELECT * FROM tb_guru WHERE id_guru = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan.' });

    if (existing.nuptk !== req.body.nuptk) {
      const [[dup]] = await pool.query('SELECT id_guru FROM tb_guru WHERE nuptk = ? AND id_guru != ?', [req.body.nuptk, id]);
      if (dup) errors.nuptk = 'NUPTK ini telah terdaftar.';
    }

    if (req.body.rfid) {
      const [[dupRfid]] = await pool.query('SELECT id_guru FROM tb_guru WHERE rfid_code = ? AND id_guru != ?', [req.body.rfid, id]);
      if (dupRfid) errors.rfid = 'RFID code sudah digunakan.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: 'Validasi gagal.', errors });
    }

    await pool.query(
      `UPDATE tb_guru SET nuptk=?, nama_guru=?, jenis_kelamin=?, alamat=?, no_hp=?, rfid_code=? WHERE id_guru=?`,
      [req.body.nuptk, req.body.nama, req.body.jk, req.body.alamat, req.body.no_hp, req.body.rfid || null, id]
    );

    res.json({ success: true, message: 'Edit data berhasil.' });
  } catch (err) {
    console.error('updateGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah data.' });
  }
}

export async function deleteGuru(req, res) {
  try {
    await pool.query('DELETE FROM tb_guru WHERE id_guru = ?', [req.params.id]);
    res.json({ success: true, message: 'Data berhasil dihapus.' });
  } catch (err) {
    console.error('deleteGuru error:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ success: false, message: 'Guru tidak dapat dihapus karena masih menjadi wali kelas atau memiliki akun login.' });
    }
    res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
  }
}

export async function importGuruCSV(req, res) {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data untuk diimpor.' });
    }

    let success = 0;
    const failed = [];

    for (const row of rows) {
      try {
        const errors = validateGuruInput(row);
        const [[dup]] = await pool.query('SELECT id_guru FROM tb_guru WHERE nuptk = ?', [row.nuptk]);
        if (dup) errors.nuptk = 'NUPTK sudah terdaftar.';

        if (Object.keys(errors).length > 0) {
          failed.push({ row, errors });
          continue;
        }

        await pool.query(
          `INSERT INTO tb_guru (nuptk, nama_guru, jenis_kelamin, alamat, no_hp, unique_code, rfid_code)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [row.nuptk, row.nama, row.jk, row.alamat, row.no_hp, generateToken(), row.rfid || null]
        );
        success++;
      } catch (e) {
        failed.push({ row, errors: { general: e.message } });
      }
    }

    res.json({ success: true, message: `${success} data berhasil diimpor, ${failed.length} gagal.`, imported: success, failed });
  } catch (err) {
    console.error('importGuruCSV error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengimpor data.' });
  }
}
