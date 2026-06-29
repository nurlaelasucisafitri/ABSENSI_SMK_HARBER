import pool from '../config/db.js';

// ── Absensi Siswa ──

export async function listAbsenSiswa(req, res) {
  try {
    const { id_kelas, tanggal } = req.query;
    if (!id_kelas || !tanggal) {
      return res.status(400).json({ success: false, message: 'id_kelas dan tanggal wajib diisi.' });
    }

    const [rows] = await pool.query(
      `SELECT s.*, p.id_presensi, p.tanggal, p.jam_masuk, p.jam_keluar, p.id_kehadiran, p.keterangan
       FROM tb_siswa s
       LEFT JOIN tb_presensi_siswa p ON p.id_siswa = s.id_siswa AND p.tanggal = ?
       WHERE s.id_kelas = ?
       ORDER BY s.nama_siswa`,
      [tanggal, id_kelas]
    );

    const lewat = new Date(tanggal) > new Date(new Date().toDateString());

    res.json({ success: true, data: rows, lewat, empty: rows.length === 0 });
  } catch (err) {
    console.error('listAbsenSiswa error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data absensi.' });
  }
}

export async function updateKehadiranSiswa(req, res) {
  try {
    const { id_siswa, id_kelas, tanggal, id_kehadiran, jam_masuk, jam_keluar, keterangan } = req.body;

    const [[existing]] = await pool.query(
      'SELECT id_presensi FROM tb_presensi_siswa WHERE id_siswa = ? AND tanggal = ?',
      [id_siswa, tanggal]
    );

    if (existing) {
      const fields = ['id_kehadiran = ?', 'keterangan = ?'];
      const params = [id_kehadiran, keterangan || ''];
      if (jam_masuk) { fields.push('jam_masuk = ?'); params.push(jam_masuk); }
      if (jam_keluar) { fields.push('jam_keluar = ?'); params.push(jam_keluar); }
      params.push(existing.id_presensi);
      await pool.query(`UPDATE tb_presensi_siswa SET ${fields.join(', ')} WHERE id_presensi = ?`, params);
    } else {
      await pool.query(
        `INSERT INTO tb_presensi_siswa (id_siswa, id_kelas, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_siswa, id_kelas, tanggal, jam_masuk || null, jam_keluar || null, id_kehadiran, keterangan || '']
      );
    }

    const [[siswa]] = await pool.query('SELECT nama_siswa FROM tb_siswa WHERE id_siswa = ?', [id_siswa]);

    res.json({ success: true, status: true, nama_siswa: siswa?.nama_siswa || '' });
  } catch (err) {
    console.error('updateKehadiranSiswa error:', err);
    res.status(500).json({ success: false, status: false, message: 'Gagal mengubah data kehadiran.' });
  }
}

export async function getDetailKehadiranSiswa(req, res) {
  try {
    const { id_presensi, id_siswa } = req.query;
    const [[presensi]] = id_presensi
      ? await pool.query('SELECT * FROM tb_presensi_siswa WHERE id_presensi = ?', [id_presensi])
      : [[null]];
    const [[siswa]] = await pool.query('SELECT * FROM tb_siswa WHERE id_siswa = ?', [id_siswa]);
    const [kehadiran] = await pool.query('SELECT * FROM tb_kehadiran');

    res.json({ success: true, presensi: presensi || null, data: siswa, listKehadiran: kehadiran });
  } catch (err) {
    console.error('getDetailKehadiranSiswa error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail kehadiran.' });
  }
}

// ── Absensi Guru ──

export async function listAbsenGuru(req, res) {
  try {
    const { tanggal } = req.query;
    if (!tanggal) return res.status(400).json({ success: false, message: 'Tanggal wajib diisi.' });

    const [rows] = await pool.query(
      `SELECT g.*, p.id_presensi, p.tanggal, p.jam_masuk, p.jam_keluar, p.id_kehadiran, p.keterangan
       FROM tb_guru g
       LEFT JOIN tb_presensi_guru p ON p.id_guru = g.id_guru AND p.tanggal = ?
       ORDER BY g.nama_guru`,
      [tanggal]
    );

    const lewat = new Date(tanggal) > new Date(new Date().toDateString());

    res.json({ success: true, data: rows, lewat, empty: rows.length === 0 });
  } catch (err) {
    console.error('listAbsenGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data absensi.' });
  }
}

export async function updateKehadiranGuru(req, res) {
  try {
    const { id_guru, tanggal, id_kehadiran, jam_masuk, jam_keluar, keterangan } = req.body;

    const [[existing]] = await pool.query(
      'SELECT id_presensi FROM tb_presensi_guru WHERE id_guru = ? AND tanggal = ?',
      [id_guru, tanggal]
    );

    if (existing) {
      const fields = ['id_kehadiran = ?', 'keterangan = ?'];
      const params = [id_kehadiran, keterangan || ''];
      if (jam_masuk) { fields.push('jam_masuk = ?'); params.push(jam_masuk); }
      if (jam_keluar) { fields.push('jam_keluar = ?'); params.push(jam_keluar); }
      params.push(existing.id_presensi);
      await pool.query(`UPDATE tb_presensi_guru SET ${fields.join(', ')} WHERE id_presensi = ?`, params);
    } else {
      await pool.query(
        `INSERT INTO tb_presensi_guru (id_guru, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id_guru, tanggal, jam_masuk || null, jam_keluar || null, id_kehadiran, keterangan || '']
      );
    }

    const [[guru]] = await pool.query('SELECT nama_guru FROM tb_guru WHERE id_guru = ?', [id_guru]);

    res.json({ success: true, status: true, nama_guru: guru?.nama_guru || '' });
  } catch (err) {
    console.error('updateKehadiranGuru error:', err);
    res.status(500).json({ success: false, status: false, message: 'Gagal mengubah data kehadiran.' });
  }
}

export async function getDetailKehadiranGuru(req, res) {
  try {
    const { id_presensi, id_guru } = req.query;
    const [[presensi]] = id_presensi
      ? await pool.query('SELECT * FROM tb_presensi_guru WHERE id_presensi = ?', [id_presensi])
      : [[null]];
    const [[guru]] = await pool.query('SELECT * FROM tb_guru WHERE id_guru = ?', [id_guru]);
    const [kehadiran] = await pool.query('SELECT * FROM tb_kehadiran');

    res.json({ success: true, presensi: presensi || null, data: guru, listKehadiran: kehadiran });
  } catch (err) {
    console.error('getDetailKehadiranGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail kehadiran.' });
  }
}
