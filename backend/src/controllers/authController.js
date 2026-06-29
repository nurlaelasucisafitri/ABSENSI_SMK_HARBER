import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { ROLE_LABELS } from '../utils/constants.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const [rows] = await pool.query(
      `SELECT au.*, g.nama_guru, g.id_guru AS guru_id_check,
              (SELECT COUNT(*) FROM tb_kelas k WHERE k.id_wali_kelas = au.id_guru) AS jumlah_kelas_diampu
       FROM app_users au
       LEFT JOIN tb_guru g ON g.id_guru = au.id_guru
       WHERE au.email = ? LIMIT 1`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.', errors: { login: 'Email tidak ditemukan' } });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Akun Anda tidak aktif. Silakan hubungi administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.', errors: { password: 'Password salah' } });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        id_guru: user.id_guru,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await pool.query('UPDATE app_users SET last_active = NOW() WHERE id = ?', [user.id]);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        roleLabel: ROLE_LABELS[user.role] || user.role,
        id_guru: user.id_guru,
        nama_guru: user.nama_guru || null,
        is_wali_kelas: Number(user.jumlah_kelas_diampu) > 0,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}

export async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT au.id, au.email, au.username, au.role, au.id_guru, g.nama_guru,
              (SELECT COUNT(*) FROM tb_kelas k WHERE k.id_wali_kelas = au.id_guru) AS jumlah_kelas_diampu
       FROM app_users au
       LEFT JOIN tb_guru g ON g.id_guru = au.id_guru
       WHERE au.id = ? LIMIT 1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({
      success: true,
      user: {
        ...user,
        roleLabel: ROLE_LABELS[user.role] || user.role,
        is_wali_kelas: Number(user.jumlah_kelas_diampu) > 0,
      },
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
}
