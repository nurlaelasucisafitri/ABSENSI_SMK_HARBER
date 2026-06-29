import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const PETUGAS_QUERY = `
  SELECT au.id, au.username, au.email, au.role, au.active, au.id_guru, au.last_active, au.created_at,
         g.nama_guru
  FROM app_users au
  LEFT JOIN tb_guru g ON g.id_guru = au.id_guru
`;

export async function listPetugas(req, res) {
  try {
    const [rows] = await pool.query(`${PETUGAS_QUERY} ORDER BY au.created_at DESC`);
    res.json({ success: true, data: rows, empty: rows.length === 0 });
  } catch (err) {
    console.error('listPetugas error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data petugas.' });
  }
}

export async function getPetugasById(req, res) {
  try {
    const [rows] = await pool.query(`${PETUGAS_QUERY} WHERE au.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Data petugas tidak ditemukan.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getPetugasById error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
}

const VALID_ROLES = ['superadmin', 'admin', 'kepsek', 'scanner', 'guru'];

export async function registerPetugas(req, res) {
  try {
    const { email, username, password, role, id_guru } = req.body;
    const errors = {};

    if (!email) errors.email = 'Email harus diisi.';
    if (!username || username.length < 6) errors.username = 'Username harus diisi minimal 6 karakter.';
    if (!password || password.length < 6) errors.password = 'Password harus diisi minimal 6 karakter.';
    if (!role || !VALID_ROLES.includes(role)) errors.role = 'Role wajib diisi.';

    if (email) {
      const [[dupEmail]] = await pool.query('SELECT id FROM app_users WHERE email = ?', [email]);
      if (dupEmail) errors.email = 'Email ini telah terdaftar.';
    }
    if (username) {
      const [[dupUser]] = await pool.query('SELECT id FROM app_users WHERE username = ?', [username]);
      if (dupUser) errors.username = 'Username ini telah terdaftar.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: 'Validasi gagal.', errors });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO app_users (email, username, password, role, id_guru, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [email, username, hashedPassword, role, role === 'guru' ? (id_guru || null) : null]
    );

    res.json({ success: true, message: 'Registrasi petugas berhasil.', id: result.insertId });
  } catch (err) {
    console.error('registerPetugas error:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan registrasi.' });
  }
}

export async function updatePetugas(req, res) {
  try {
    const id = req.body.id || req.params.id;
    const { email, username, password, role, id_guru } = req.body;
    const errors = {};

    const [[existing]] = await pool.query('SELECT * FROM app_users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data petugas tidak ditemukan.' });

    if (!email) errors.email = 'Email harus diisi.';
    if (!username || username.length < 6) errors.username = 'Username harus diisi minimal 6 karakter.';
    if (!role || !VALID_ROLES.includes(role)) errors.role = 'Role wajib diisi.';
    if (password && password.length > 0 && password.length < 6) errors.password = 'Password minimal 6 karakter.';

    if (email && email !== existing.email) {
      const [[dupEmail]] = await pool.query('SELECT id FROM app_users WHERE email = ? AND id != ?', [email, id]);
      if (dupEmail) errors.email = 'Email ini telah terdaftar.';
    }
    if (username && username !== existing.username) {
      const [[dupUser]] = await pool.query('SELECT id FROM app_users WHERE username = ? AND id != ?', [username, id]);
      if (dupUser) errors.username = 'Username ini telah terdaftar.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, message: 'Validasi gagal.', errors });
    }

    const fields = ['email = ?', 'username = ?', 'role = ?', 'id_guru = ?', 'updated_at = NOW()'];
    const params = [email, username, role, role === 'guru' ? (id_guru || null) : null];

    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      params.push(hashedPassword);
    }

    params.push(id);
    await pool.query(`UPDATE app_users SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Edit data berhasil.' });
  } catch (err) {
    console.error('updatePetugas error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah data.' });
  }
}

export async function deletePetugas(req, res) {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }
    await pool.query('DELETE FROM app_users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data berhasil dihapus.' });
  } catch (err) {
    console.error('deletePetugas error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
  }
}

export async function toggleActivation(req, res) {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' });
    }
    const [[existing]] = await pool.query('SELECT active FROM app_users WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const newStatus = existing.active ? 0 : 1;
    await pool.query('UPDATE app_users SET active = ? WHERE id = ?', [newStatus, req.params.id]);
    res.json({ success: true, message: newStatus ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.', active: newStatus });
  } catch (err) {
    console.error('toggleActivation error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status.' });
  }
}
