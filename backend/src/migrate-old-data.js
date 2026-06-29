import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

/**
 * Script migrasi data dari database lama (CodeIgniter Shield + tb_* tables)
 * ke schema baru (app_users + tb_* tables, struktur tb_* tetap sama).
 *
 * Cara pakai:
 *   node src/migrate-old-data.js /path/ke/db_absensi_lama.sql
 *
 * Script ini akan:
 * 1. Membaca file SQL lama dan mengekstrak data tb_jurusan, tb_kelas,
 *    tb_guru, tb_siswa, tb_presensi_siswa, tb_presensi_guru, general_settings
 * 2. Mengekstrak akun superadmin dari auth_identities (email + password hash asli
 *    dipertahankan, karena bcrypt $2y$ dari PHP kompatibel dibaca oleh bcryptjs)
 * 3. Memasukkan semuanya ke database baru (db_absensi) tanpa mengubah hash password
 */

function extractInsertBlock(sql, tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\`[^V]*VALUES\\s*([\\s\\S]*?);`, 'g');
  const blocks = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    blocks.push(match[1]);
  }
  return blocks.join(',\n');
}

function parseValuesBlock(block) {
  // Parser sederhana untuk baris VALUES (a, b, 'c', NULL), (d, e, 'f', NULL), ...
  const rows = [];
  let depth = 0, current = '', inString = false, stringChar = '';
  const tokens = [];

  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inString) {
      current += ch;
      if (ch === stringChar && block[i - 1] !== '\\') inString = false;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }
    if (ch === '(') { depth++; if (depth === 1) { current = ''; continue; } }
    if (ch === ')') {
      depth--;
      if (depth === 0) {
        tokens.push(current);
        current = '';
        continue;
      }
    }
    current += ch;
  }

  for (const t of tokens) {
    const values = [];
    let buf = '', inStr = false, strCh = '';
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (inStr) {
        if (ch === strCh && t[i - 1] !== '\\') { inStr = false; buf += ch; continue; }
        buf += ch;
        continue;
      }
      if (ch === "'" || ch === '"') { inStr = true; strCh = ch; buf += ch; continue; }
      if (ch === ',' && !inStr) { values.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim().length > 0) values.push(buf.trim());

    rows.push(values.map((v) => {
      v = v.trim();
      if (v === 'NULL') return null;
      if (/^'.*'$/.test(v)) return v.slice(1, -1).replace(/\\'/g, "'");
      if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
      return v;
    }));
  }

  return rows;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Penggunaan: node src/migrate-old-data.js /path/ke/db_absensi_lama.sql');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.resolve(filePath), 'utf-8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_absensi',
  });

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  // ── Jurusan ──
  const jurusanRows = parseValuesBlock(extractInsertBlock(sql, 'tb_jurusan'));
  for (const row of jurusanRows) {
    const [id, jurusan] = row;
    await connection.query(
      'INSERT INTO tb_jurusan (id, jurusan, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE jurusan=VALUES(jurusan)',
      [id, jurusan]
    );
  }
  console.log(`✓ ${jurusanRows.length} data jurusan dimigrasikan.`);

  // ── Kelas ──
  const kelasRows = parseValuesBlock(extractInsertBlock(sql, 'tb_kelas'));
  for (const row of kelasRows) {
    const [id_kelas, tingkat, id_jurusan, index_kelas, id_wali_kelas] = row;
    await connection.query(
      'INSERT INTO tb_kelas (id_kelas, tingkat, id_jurusan, index_kelas, id_wali_kelas, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE tingkat=VALUES(tingkat)',
      [id_kelas, tingkat, id_jurusan, index_kelas, id_wali_kelas]
    );
  }
  console.log(`✓ ${kelasRows.length} data kelas dimigrasikan.`);

  // ── Guru ──
  const guruRows = parseValuesBlock(extractInsertBlock(sql, 'tb_guru'));
  for (const row of guruRows) {
    const [id_guru, nuptk, nama_guru, jenis_kelamin, alamat, no_hp, unique_code, rfid_code] = row;
    await connection.query(
      'INSERT INTO tb_guru (id_guru, nuptk, nama_guru, jenis_kelamin, alamat, no_hp, unique_code, rfid_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_guru=VALUES(nama_guru)',
      [id_guru, nuptk, nama_guru, jenis_kelamin, alamat, no_hp, unique_code, rfid_code]
    );
  }
  console.log(`✓ ${guruRows.length} data guru dimigrasikan.`);

  // ── Siswa ──
  const siswaRows = parseValuesBlock(extractInsertBlock(sql, 'tb_siswa'));
  for (const row of siswaRows) {
    const [id_siswa, nis, nama_siswa, id_kelas, jenis_kelamin, no_hp, unique_code, rfid_code, foto] = row;
    await connection.query(
      'INSERT INTO tb_siswa (id_siswa, nis, nama_siswa, id_kelas, jenis_kelamin, no_hp, unique_code, rfid_code, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_siswa=VALUES(nama_siswa)',
      [id_siswa, nis, nama_siswa, id_kelas, jenis_kelamin, no_hp, unique_code, rfid_code, foto]
    );
  }
  console.log(`✓ ${siswaRows.length} data siswa dimigrasikan.`);
  if (siswaRows.length > 0) {
    console.log('  ⚠ Catatan: foto siswa (jika ada) perlu disalin manual ke backend/uploads/siswa/');
  }

  // ── Presensi Siswa ──
  const presensiSiswaRows = parseValuesBlock(extractInsertBlock(sql, 'tb_presensi_siswa'));
  for (const row of presensiSiswaRows) {
    const [id_presensi, id_siswa, id_kelas, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan] = row;
    await connection.query(
      'INSERT INTO tb_presensi_siswa (id_presensi, id_siswa, id_kelas, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id_kehadiran=VALUES(id_kehadiran)',
      [id_presensi, id_siswa, id_kelas, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan || '']
    );
  }
  console.log(`✓ ${presensiSiswaRows.length} data presensi siswa dimigrasikan.`);

  // ── Presensi Guru ──
  const presensiGuruRows = parseValuesBlock(extractInsertBlock(sql, 'tb_presensi_guru'));
  for (const row of presensiGuruRows) {
    const [id_presensi, id_guru, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan] = row;
    await connection.query(
      'INSERT INTO tb_presensi_guru (id_presensi, id_guru, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id_kehadiran=VALUES(id_kehadiran)',
      [id_presensi, id_guru, tanggal, jam_masuk, jam_keluar, id_kehadiran, keterangan || '']
    );
  }
  console.log(`✓ ${presensiGuruRows.length} data presensi guru dimigrasikan.`);

  // ── General Settings ──
  const settingsRows = parseValuesBlock(extractInsertBlock(sql, 'general_settings'));
  for (const row of settingsRows) {
    const [id, logo, school_name, school_year, copyright] = row;
    await connection.query(
      'INSERT INTO general_settings (id, logo, school_name, school_year, copyright) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE school_name=VALUES(school_name), school_year=VALUES(school_year)',
      [id, logo, school_name, school_year, copyright]
    );
  }
  console.log(`✓ ${settingsRows.length} data general_settings dimigrasikan.`);

  // ── Akun Superadmin (dari auth_identities, password hash bcrypt PHP $2y$ dipertahankan) ──
  const identityRows = parseValuesBlock(extractInsertBlock(sql, 'auth_identities'));
  const usersRows = parseValuesBlock(extractInsertBlock(sql, 'users'));

  for (const idRow of identityRows) {
    const [, user_id, type, , email, passwordHash] = idRow;
    if (type !== 'email_password') continue;

    const userRow = usersRows.find((u) => u[0] === user_id);
    const username = userRow ? userRow[2] : `user${user_id}`;
    const id_guru = userRow ? userRow[1] : null;

    await connection.query(
      `INSERT INTO app_users (username, email, password, role, id_guru, active, created_at, updated_at)
       VALUES (?, ?, ?, 'superadmin', ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE password=VALUES(password), username=VALUES(username)`,
      [username, email, passwordHash, id_guru]
    );
    console.log(`✓ Akun "${email}" (role: superadmin, password asli dipertahankan) dimigrasikan.`);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  await connection.end();
  console.log('\n✓ Migrasi data lama selesai. Pastikan untuk menyalin foto siswa secara manual jika ada.');
}

main().catch((err) => {
  console.error('✗ Gagal melakukan migrasi:', err);
  process.exit(1);
});
