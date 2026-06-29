import pool from '../config/db.js';
import {
  countPresensiSiswa,
  countPresensiGuru,
  getAttendanceTrendSiswa,
  getAttendanceTrendGuru,
  getDateRangeLabels,
  todayDateString,
} from '../utils/attendanceStats.js';

export async function getDashboard(req, res) {
  try {
    const today = todayDateString();

    const [[siswaRows], [guruRows], [kelasRows], [jurusanRows], [petugasRows], [totalSiswaRow], [totalGuruRow]] = await Promise.all([
      pool.query('SELECT id_siswa FROM tb_siswa'),
      pool.query('SELECT id_guru FROM tb_guru'),
      pool.query(`
        SELECT k.*, j.jurusan,
          (SELECT COUNT(*) FROM tb_siswa s WHERE s.id_kelas = k.id_kelas) AS jumlah_siswa
        FROM tb_kelas k LEFT JOIN tb_jurusan j ON j.id = k.id_jurusan
        ORDER BY k.tingkat, j.jurusan, k.index_kelas
      `),
      pool.query('SELECT * FROM tb_jurusan ORDER BY jurusan'),
      pool.query('SELECT id FROM app_users'),
      pool.query('SELECT COUNT(*) AS total FROM tb_siswa'),
      pool.query('SELECT COUNT(*) AS total FROM tb_guru'),
    ]);

    const [grafikKehadiranSiswa, grafikKehadiranGuru] = await Promise.all([
      getAttendanceTrendSiswa(7),
      getAttendanceTrendGuru(7),
    ]);

    const [hadirS, sakitS, izinS, alfaS, hadirG, sakitG, izinG, alfaG] = await Promise.all([
      countPresensiSiswa(1, today),
      countPresensiSiswa(2, today),
      countPresensiSiswa(3, today),
      countPresensiSiswa(4, today),
      countPresensiGuru(1, today),
      countPresensiGuru(2, today),
      countPresensiGuru(3, today),
      countPresensiGuru(4, today),
    ]);

    res.json({
      success: true,
      data: {
        siswaCount: siswaRows.length,
        guruCount: guruRows.length,
        kelas: kelasRows,
        jurusan: jurusanRows,
        petugasCount: petugasRows.length,
        dateRange: getDateRangeLabels(7),
        dateNow: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        grafikKehadiranSiswa,
        grafikKehadiranGuru,
        jumlahKehadiranSiswa: { hadir: Number(hadirS), sakit: Number(sakitS), izin: Number(izinS), alfa: Number(alfaS) },
        jumlahKehadiranGuru: { hadir: Number(hadirG), sakit: Number(sakitG), izin: Number(izinG), alfa: Number(alfaG) },
        totalSiswa: Number(totalSiswaRow[0].total),
        totalGuru: Number(totalGuruRow[0].total),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat data dashboard.' });
  }
}

export async function filterDashboardData(req, res) {
  try {
    const { id_kelas } = req.body;
    const idKelas = id_kelas || null;
    const today = todayDateString();

    const [hadir, sakit, izin, alfa] = await Promise.all([
      countPresensiSiswa(1, today, idKelas),
      countPresensiSiswa(2, today, idKelas),
      countPresensiSiswa(3, today, idKelas),
      countPresensiSiswa(4, today, idKelas),
    ]);

    const chartData = await getAttendanceTrendSiswa(7, idKelas);

    let totalSiswaQuery = 'SELECT COUNT(*) AS total FROM tb_siswa';
    const params = [];
    if (idKelas) {
      totalSiswaQuery += ' WHERE id_kelas = ?';
      params.push(idKelas);
    }
    const [totalRow] = await pool.query(totalSiswaQuery, params);

    res.json({
      success: true,
      data: {
        hadir: Number(hadir),
        sakit: Number(sakit),
        izin: Number(izin),
        alfa: Number(alfa),
        totalSiswa: Number(totalRow[0].total),
        chartData,
      },
    });
  } catch (err) {
    console.error('Filter dashboard error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat data filter.' });
  }
}
