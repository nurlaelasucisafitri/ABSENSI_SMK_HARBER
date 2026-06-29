import pool from '../config/db.js';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { uploadsRoot } from '../middleware/upload.js';

const TABLES = ['tb_jurusan', 'tb_kelas', 'tb_guru', 'tb_siswa', 'tb_presensi_siswa', 'tb_presensi_guru', 'general_settings'];

/** Backup database (tabel data inti) dalam format JSON */
export async function dbBackup(req, res) {
  try {
    const backup = { created_at: new Date().toISOString(), tables: {} };

    for (const table of TABLES) {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      backup.tables[table] = rows;
    }

    const filename = `backup_db_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    console.error('dbBackup error:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan backup database.' });
  }
}

/** Restore database dari file JSON backup (mengganti seluruh isi tabel) */
export async function dbRestore(req, res) {
  const connection = await pool.getConnection();
  try {
    if (!req.file) {
      connection.release();
      return res.status(400).json({ success: false, message: 'File backup wajib diunggah.' });
    }

    const raw = fs.readFileSync(req.file.path, 'utf-8');
    const backup = JSON.parse(raw);

    if (!backup.tables) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Format file backup tidak valid.' });
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.beginTransaction();

    // Urutan restore: independent tables dulu
    const restoreOrder = ['tb_jurusan', 'tb_kelas', 'tb_guru', 'tb_siswa', 'tb_presensi_siswa', 'tb_presensi_guru', 'general_settings'];

    for (const table of restoreOrder) {
      const rows = backup.tables[table];
      if (!Array.isArray(rows)) continue;

      await connection.query(`DELETE FROM ${table}`);
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const placeholders = `(${columns.map(() => '?').join(',')})`;
      const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${rows.map(() => placeholders).join(',')}`;
      const values = rows.flatMap((row) => columns.map((c) => row[c]));
      await connection.query(sql, values);
    }

    await connection.commit();
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    connection.release();

    fs.unlinkSync(req.file.path);

    res.json({ success: true, message: 'Database berhasil direstore.' });
  } catch (err) {
    console.error('dbRestore error:', err);
    try { await connection.rollback(); } catch (_) {}
    connection.release();
    res.status(500).json({ success: false, message: 'Gagal melakukan restore database: ' + err.message });
  }
}

/** Backup semua foto siswa & logo sebagai ZIP */
export async function photosBackup(req, res) {
  try {
    const filename = `backup_photos_${new Date().toISOString().slice(0, 10)}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const siswaDir = path.join(uploadsRoot, 'siswa');
    const logoDir = path.join(uploadsRoot, 'logo');

    if (fs.existsSync(siswaDir)) archive.directory(siswaDir, 'siswa');
    if (fs.existsSync(logoDir)) archive.directory(logoDir, 'logo');

    await archive.finalize();
  } catch (err) {
    console.error('photosBackup error:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan backup foto.' });
  }
}

/** Restore foto dari file ZIP (memerlukan ekstraksi manual oleh admin, fitur ini hanya menyimpan file ZIP) */
export async function photosRestore(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File backup wajib diunggah.' });
    }
    res.json({ success: true, message: 'File backup foto berhasil diunggah. Hubungi developer untuk ekstraksi manual jika diperlukan.' });
  } catch (err) {
    console.error('photosRestore error:', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan restore foto.' });
  }
}
