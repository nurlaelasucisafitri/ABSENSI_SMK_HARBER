import pool from '../config/db.js';

/**
 * Hitung jumlah presensi siswa pada tanggal tertentu berdasarkan id_kehadiran.
 * id_kehadiran = '4' artinya "Tanpa keterangan" (alfa): siswa yang TIDAK punya
 * record presensi hari itu, atau record-nya bukan hadir/sakit/izin.
 */
export async function countPresensiSiswa(idKehadiran, tanggal, idKelas = null) {
  if (String(idKehadiran) === '4') {
    let query = `
      SELECT COUNT(*) AS total FROM tb_siswa s
      LEFT JOIN tb_presensi_siswa p ON p.id_siswa = s.id_siswa AND p.tanggal = ?
      WHERE (p.id_kehadiran IS NULL OR p.id_kehadiran NOT IN (1,2,3))
    `;
    const params = [tanggal];
    if (idKelas) {
      query += ' AND s.id_kelas = ?';
      params.push(idKelas);
    }
    const [rows] = await pool.query(query, params);
    return rows[0].total;
  }

  let query = `
    SELECT COUNT(*) AS total FROM tb_presensi_siswa p
    RIGHT JOIN tb_siswa s ON p.id_siswa = s.id_siswa AND p.tanggal = ?
    WHERE p.id_kehadiran = ?
  `;
  const params = [tanggal, idKehadiran];
  if (idKelas) {
    query += ' AND s.id_kelas = ?';
    params.push(idKelas);
  }
  const [rows] = await pool.query(query, params);
  return rows[0].total;
}

export async function countPresensiGuru(idKehadiran, tanggal) {
  if (String(idKehadiran) === '4') {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tb_guru g
       LEFT JOIN tb_presensi_guru p ON p.id_guru = g.id_guru AND p.tanggal = ?
       WHERE (p.id_kehadiran IS NULL OR p.id_kehadiran NOT IN (1,2,3))`,
      [tanggal]
    );
    return rows[0].total;
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM tb_presensi_guru p
     RIGHT JOIN tb_guru g ON p.id_guru = g.id_guru AND p.tanggal = ?
     WHERE p.id_kehadiran = ?`,
    [tanggal, idKehadiran]
  );
  return rows[0].total;
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getAttendanceTrendSiswa(days = 7, idKelas = null) {
  const result = { hadir: [], sakit: [], izin: [], alfa: [] };
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateLocal(d);

    result.hadir.push(Number(await countPresensiSiswa(1, dateStr, idKelas)));
    result.sakit.push(Number(await countPresensiSiswa(2, dateStr, idKelas)));
    result.izin.push(Number(await countPresensiSiswa(3, dateStr, idKelas)));
    result.alfa.push(Number(await countPresensiSiswa(4, dateStr, idKelas)));
  }
  return result;
}

export async function getAttendanceTrendGuru(days = 7) {
  const result = { hadir: [], sakit: [], izin: [], alfa: [] };
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateLocal(d);

    result.hadir.push(Number(await countPresensiGuru(1, dateStr)));
    result.sakit.push(Number(await countPresensiGuru(2, dateStr)));
    result.izin.push(Number(await countPresensiGuru(3, dateStr)));
    result.alfa.push(Number(await countPresensiGuru(4, dateStr)));
  }
  return result;
}

export function getDateRangeLabels(days = 7) {
  const labels = [];
  const now = new Date();
  const hariSingkat = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = days - 1; i >= 0; i--) {
    if (i === 0) {
      labels.push('Hari ini');
    } else {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(`${d.getDate()} ${hariSingkat[d.getDay()]}`);
    }
  }
  return labels;
}

export function todayDateString() {
  return formatDateLocal(new Date());
}
