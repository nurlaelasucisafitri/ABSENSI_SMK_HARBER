import pool from '../config/db.js';
import PDFDocument from 'pdfkit';

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN_NAMA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function pad2(n) { return String(n).padStart(2, '0'); }
function toDateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

/** Bangun array tanggal kerja (skip Sabtu/Minggu) untuk bulan "YYYY-MM" */
function buildWorkingDays(bulanStr) {
  const [year, month] = bulanStr.split('-').map(Number);
  const lastDate = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= lastDate; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay(); // 0=Min, 6=Sab
    if (dow !== 0 && dow !== 6) {
      days.push(date);
    }
  }
  return days;
}

async function getGeneralSettings() {
  const [[row]] = await pool.query('SELECT * FROM general_settings LIMIT 1');
  return row || { school_name: 'SMK Harapan Bersama Tegal', school_year: '2024/2025' };
}

// ============================================================
// LAPORAN SISWA
// ============================================================

export async function generateLaporanSiswaData(req, res) {
  try {
    const { kelas: idKelas, bulan } = req.body;

    const [siswaList] = await pool.query('SELECT * FROM tb_siswa WHERE id_kelas = ? ORDER BY nama_siswa', [idKelas]);
    if (siswaList.length === 0) {
      return res.status(404).json({ success: false, message: 'Data siswa kosong!' });
    }

    const [[kelasRow]] = await pool.query(
      `SELECT k.*, j.jurusan, CONCAT(k.tingkat, ' ', j.jurusan, ' ', k.index_kelas) AS kelas
       FROM tb_kelas k LEFT JOIN tb_jurusan j ON j.id = k.id_jurusan WHERE k.id_kelas = ?`,
      [idKelas]
    );

    const workingDays = buildWorkingDays(bulan);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // ambil semua presensi sebulan untuk kelas ini sekaligus (lebih efisien)
    const [presensiBulan] = await pool.query(
      `SELECT * FROM tb_presensi_siswa WHERE id_kelas = ? AND tanggal BETWEEN ? AND ?`,
      [idKelas, toDateStr(workingDays[0]), toDateStr(workingDays[workingDays.length - 1])]
    );

    const presensiMap = {}; // key: `${id_siswa}_${tanggal}`
    for (const p of presensiBulan) {
      presensiMap[`${p.id_siswa}_${p.tanggal}`] = p;
    }

    const tanggalList = workingDays.map((d) => ({
      tanggal: toDateStr(d),
      hariSingkat: HARI_SINGKAT[d.getDay()],
      tgl: d.getDate(),
      lewat: d > today,
    }));

    const rows = siswaList.map((siswa) => {
      let hadir = 0, sakit = 0, izin = 0, alfa = 0;
      const harian = tanggalList.map((t) => {
        if (t.lewat) return { id_kehadiran: null, lewat: true };
        const p = presensiMap[`${siswa.id_siswa}_${t.tanggal}`];
        const idK = p ? p.id_kehadiran : 4;
        if (idK === 1) hadir++;
        else if (idK === 2) sakit++;
        else if (idK === 3) izin++;
        else alfa++;
        return { id_kehadiran: idK, lewat: false };
      });
      return { siswa, harian, hadir, sakit, izin, alfa };
    });

    const laki = siswaList.filter((s) => s.jenis_kelamin !== 'Perempuan').length;
    const generalSettings = await getGeneralSettings();

    res.json({
      success: true,
      data: {
        tanggalList,
        bulanLabel: `${BULAN_NAMA[Number(bulan.split('-')[1]) - 1]} ${bulan.split('-')[0]}`,
        kelas: kelasRow,
        rows,
        rekap: { laki, perempuan: siswaList.length - laki, total: siswaList.length },
        generalSettings,
      },
    });
  } catch (err) {
    console.error('generateLaporanSiswaData error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat laporan.' });
  }
}

function buildLaporanSiswaHtml(data) {
  const { tanggalList, bulanLabel, kelas, rows, rekap, generalSettings } = data;
  const kehadiranCell = (h) => {
    if (h.lewat) return '<td></td>';
    const map = { 1: ['H', '#90ee90'], 2: ['S', '#ffff00'], 3: ['I', '#ffff00'], 4: ['A', '#ff6b6b'] };
    const [text, bg] = map[h.id_kehadiran] || ['A', '#ff6b6b'];
    return `<td align="center" style="background-color:${bg};">${text}</td>`;
  };

  const headerTanggal = tanggalList.map((t) => `<th align="center">${t.hariSingkat}</th>`).join('');
  const headerTgl = tanggalList.map((t) => `<th align="center">${t.tgl}</th>`).join('');

  const bodyRows = rows.map((r, i) => `
    <tr>
      <td align="center">${i + 1}</td>
      <td>${r.siswa.nama_siswa}</td>
      ${r.harian.map(kehadiranCell).join('')}
      <td align="center">${r.hadir || '-'}</td>
      <td align="center">${r.sakit || '-'}</td>
      <td align="center">${r.izin || '-'}</td>
      <td align="center">${r.alfa || '-'}</td>
    </tr>
  `).join('');

  return `
  <html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;">
  <table style="width:100%;">
    <tr>
      <td style="width:100px;"></td>
      <td style="text-align:center;">
        <h2>DAFTAR HADIR SISWA</h2>
        <h4>${generalSettings.school_name}</h4>
        <h4>TAHUN PELAJARAN ${generalSettings.school_year}</h4>
      </td>
      <td style="width:100px;"></td>
    </tr>
  </table>
  <p>Bulan : ${bulanLabel}<span style="float:right;">Kelas : ${kelas.kelas}</span></p>
  <table align="center" border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;">
    <tr><td></td><td></td><th colspan="${tanggalList.length}">Hari/Tanggal</th></tr>
    <tr><td></td><td></td>${headerTanggal}<td colspan="4" align="center">Total</td></tr>
    <tr>
      <th align="center">No</th><th>Nama</th>${headerTgl}
      <th align="center" style="background-color:#90ee90;">H</th>
      <th align="center" style="background-color:#ffff00;">S</th>
      <th align="center" style="background-color:#ffff00;">I</th>
      <th align="center" style="background-color:#ff6b6b;">A</th>
    </tr>
    ${bodyRows}
  </table>
  <br/>
  <table>
    <tr><td>Jumlah siswa</td><td>: ${rekap.total}</td></tr>
    <tr><td>Laki-laki</td><td>: ${rekap.laki}</td></tr>
    <tr><td>Perempuan</td><td>: ${rekap.perempuan}</td></tr>
  </table>
  </body></html>`;
}

export async function exportLaporanSiswaDoc(req, res) {
  try {
    const { kelas: idKelas, bulan } = req.body;
    const fakeReq = { body: { kelas: idKelas, bulan } };
    let payload;
    await generateLaporanSiswaData(fakeReq, { json: (p) => { payload = p; }, status: () => ({ json: (p) => { payload = p; } }) });

    if (!payload?.success) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const html = buildLaporanSiswaHtml(payload.data);
    const filename = `laporan_absen_${payload.data.kelas.kelas.replace(/\s+/g, '_')}_${payload.data.bulanLabel.replace(/\s+/g, '-')}.doc`;

    res.setHeader('Content-Type', 'application/vnd.ms-word');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    console.error('exportLaporanSiswaDoc error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengekspor laporan.' });
  }
}

export async function exportLaporanSiswaPdf(req, res) {
  try {
    const { kelas: idKelas, bulan } = req.body;
    let payload;
    await generateLaporanSiswaData({ body: { kelas: idKelas, bulan } }, { json: (p) => { payload = p; }, status: () => ({ json: (p) => { payload = p; } }) });

    if (!payload?.success) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const { tanggalList, bulanLabel, kelas, rows, rekap, generalSettings } = payload.data;
    const filename = `laporan_absen_${kelas.kelas.replace(/\s+/g, '_')}_${bulanLabel.replace(/\s+/g, '-')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(14).text('DAFTAR HADIR SISWA', { align: 'center' });
    doc.fontSize(10).text(generalSettings.school_name, { align: 'center' });
    doc.text(`TAHUN PELAJARAN ${generalSettings.school_year}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Bulan: ${bulanLabel}     Kelas: ${kelas.kelas}`);
    doc.moveDown(0.5);

    const startX = doc.x;
    let y = doc.y;
    const colNo = 25, colNama = 110, colDay = 16, colSum = 22;
    const tableWidth = colNo + colNama + colDay * tanggalList.length + colSum * 4;

    function drawRow(cells, widths, opts = {}) {
      let x = startX;
      const rowH = 16;
      cells.forEach((c, i) => {
        if (opts.bg && opts.bg[i]) {
          doc.rect(x, y, widths[i], rowH).fill(opts.bg[i]);
          doc.fillColor('black');
        }
        doc.fontSize(7).text(String(c), x + 1, y + 4, { width: widths[i] - 2, align: 'center' });
        x += widths[i];
      });
      y += rowH;
    }

    const widths = [colNo, colNama, ...tanggalList.map(() => colDay), colSum, colSum, colSum, colSum];
    drawRow(['No', 'Nama', ...tanggalList.map((t) => t.tgl), 'H', 'S', 'I', 'A'], widths);

    for (const [i, r] of rows.entries()) {
      if (y > doc.page.height - 60) { doc.addPage(); y = doc.y; }
      const map = { 1: ['H', '#90ee90'], 2: ['S', '#ffff00'], 3: ['I', '#ffff00'], 4: ['A', '#ff6b6b'] };
      const harianCells = r.harian.map((h) => (h.lewat ? '' : (map[h.id_kehadiran]?.[0] || 'A')));
      const harianBg = r.harian.map((h) => (h.lewat ? null : (map[h.id_kehadiran]?.[1] || '#ff6b6b')));
      drawRow(
        [i + 1, r.siswa.nama_siswa, ...harianCells, r.hadir || '-', r.sakit || '-', r.izin || '-', r.alfa || '-'],
        widths,
        { bg: [null, null, ...harianBg, null, null, null, null] }
      );
    }

    doc.moveDown(1);
    doc.fontSize(9).text(`Jumlah siswa: ${rekap.total}    Laki-laki: ${rekap.laki}    Perempuan: ${rekap.perempuan}`, startX, y + 10);

    doc.end();
  } catch (err) {
    console.error('exportLaporanSiswaPdf error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengekspor laporan PDF.' });
  }
}

// ============================================================
// LAPORAN GURU
// ============================================================

export async function generateLaporanGuruData(req, res) {
  try {
    const { bulan } = req.body;
    const [guruList] = await pool.query('SELECT * FROM tb_guru ORDER BY nama_guru');
    if (guruList.length === 0) {
      return res.status(404).json({ success: false, message: 'Data guru kosong!' });
    }

    const workingDays = buildWorkingDays(bulan);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [presensiBulan] = await pool.query(
      `SELECT * FROM tb_presensi_guru WHERE tanggal BETWEEN ? AND ?`,
      [toDateStr(workingDays[0]), toDateStr(workingDays[workingDays.length - 1])]
    );
    const presensiMap = {};
    for (const p of presensiBulan) presensiMap[`${p.id_guru}_${p.tanggal}`] = p;

    const tanggalList = workingDays.map((d) => ({
      tanggal: toDateStr(d), hariSingkat: HARI_SINGKAT[d.getDay()], tgl: d.getDate(), lewat: d > today,
    }));

    const rows = guruList.map((guru) => {
      let hadir = 0, sakit = 0, izin = 0, alfa = 0;
      const harian = tanggalList.map((t) => {
        if (t.lewat) return { id_kehadiran: null, lewat: true };
        const p = presensiMap[`${guru.id_guru}_${t.tanggal}`];
        const idK = p ? p.id_kehadiran : 4;
        if (idK === 1) hadir++; else if (idK === 2) sakit++; else if (idK === 3) izin++; else alfa++;
        return { id_kehadiran: idK, lewat: false };
      });
      return { guru, harian, hadir, sakit, izin, alfa };
    });

    const laki = guruList.filter((g) => g.jenis_kelamin !== 'Perempuan').length;
    const generalSettings = await getGeneralSettings();

    res.json({
      success: true,
      data: {
        tanggalList,
        bulanLabel: `${BULAN_NAMA[Number(bulan.split('-')[1]) - 1]} ${bulan.split('-')[0]}`,
        rows,
        rekap: { laki, perempuan: guruList.length - laki, total: guruList.length },
        generalSettings,
      },
    });
  } catch (err) {
    console.error('generateLaporanGuruData error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat laporan.' });
  }
}

function buildLaporanGuruHtml(data) {
  const { tanggalList, bulanLabel, rows, rekap, generalSettings } = data;
  const kehadiranCell = (h) => {
    if (h.lewat) return '<td></td>';
    const map = { 1: ['H', '#90ee90'], 2: ['S', '#ffff00'], 3: ['I', '#ffff00'], 4: ['A', '#ff6b6b'] };
    const [text, bg] = map[h.id_kehadiran] || ['A', '#ff6b6b'];
    return `<td align="center" style="background-color:${bg};">${text}</td>`;
  };
  const headerTanggal = tanggalList.map((t) => `<th align="center">${t.hariSingkat}</th>`).join('');
  const headerTgl = tanggalList.map((t) => `<th align="center">${t.tgl}</th>`).join('');
  const bodyRows = rows.map((r, i) => `
    <tr>
      <td align="center">${i + 1}</td>
      <td>${r.guru.nama_guru}</td>
      ${r.harian.map(kehadiranCell).join('')}
      <td align="center">${r.hadir || '-'}</td>
      <td align="center">${r.sakit || '-'}</td>
      <td align="center">${r.izin || '-'}</td>
      <td align="center">${r.alfa || '-'}</td>
    </tr>
  `).join('');

  return `
  <html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;">
  <table style="width:100%;">
    <tr>
      <td style="width:100px;"></td>
      <td style="text-align:center;">
        <h2>DAFTAR HADIR GURU</h2>
        <h4>${generalSettings.school_name}</h4>
        <h4>TAHUN PELAJARAN ${generalSettings.school_year}</h4>
      </td>
      <td style="width:100px;"></td>
    </tr>
  </table>
  <p>Bulan : ${bulanLabel}</p>
  <table align="center" border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;width:100%;">
    <tr><td></td><td></td><th colspan="${tanggalList.length}">Hari/Tanggal</th></tr>
    <tr><td></td><td></td>${headerTanggal}<td colspan="4" align="center">Total</td></tr>
    <tr>
      <th align="center">No</th><th>Nama</th>${headerTgl}
      <th align="center" style="background-color:#90ee90;">H</th>
      <th align="center" style="background-color:#ffff00;">S</th>
      <th align="center" style="background-color:#ffff00;">I</th>
      <th align="center" style="background-color:#ff6b6b;">A</th>
    </tr>
    ${bodyRows}
  </table>
  <br/>
  <table>
    <tr><td>Jumlah guru</td><td>: ${rekap.total}</td></tr>
    <tr><td>Laki-laki</td><td>: ${rekap.laki}</td></tr>
    <tr><td>Perempuan</td><td>: ${rekap.perempuan}</td></tr>
  </table>
  </body></html>`;
}

export async function exportLaporanGuruDoc(req, res) {
  try {
    const { bulan } = req.body;
    let payload;
    await generateLaporanGuruData({ body: { bulan } }, { json: (p) => { payload = p; }, status: () => ({ json: (p) => { payload = p; } }) });
    if (!payload?.success) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const html = buildLaporanGuruHtml(payload.data);
    const filename = `laporan_absen_guru_${payload.data.bulanLabel.replace(/\s+/g, '-')}.doc`;
    res.setHeader('Content-Type', 'application/vnd.ms-word');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (err) {
    console.error('exportLaporanGuruDoc error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengekspor laporan.' });
  }
}

export async function exportLaporanGuruPdf(req, res) {
  try {
    const { bulan } = req.body;
    let payload;
    await generateLaporanGuruData({ body: { bulan } }, { json: (p) => { payload = p; }, status: () => ({ json: (p) => { payload = p; } }) });
    if (!payload?.success) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

    const { tanggalList, bulanLabel, rows, rekap, generalSettings } = payload.data;
    const filename = `laporan_absen_guru_${bulanLabel.replace(/\s+/g, '-')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(14).text('DAFTAR HADIR GURU', { align: 'center' });
    doc.fontSize(10).text(generalSettings.school_name, { align: 'center' });
    doc.text(`TAHUN PELAJARAN ${generalSettings.school_year}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Bulan: ${bulanLabel}`);
    doc.moveDown(0.5);

    const startX = doc.x;
    let y = doc.y;
    const colNo = 25, colNama = 130, colDay = 16, colSum = 22;
    function drawRow(cells, widths, opts = {}) {
      let x = startX;
      const rowH = 16;
      cells.forEach((c, i) => {
        if (opts.bg && opts.bg[i]) {
          doc.rect(x, y, widths[i], rowH).fill(opts.bg[i]);
          doc.fillColor('black');
        }
        doc.fontSize(7).text(String(c), x + 1, y + 4, { width: widths[i] - 2, align: 'center' });
        x += widths[i];
      });
      y += rowH;
    }
    const widths = [colNo, colNama, ...tanggalList.map(() => colDay), colSum, colSum, colSum, colSum];
    drawRow(['No', 'Nama', ...tanggalList.map((t) => t.tgl), 'H', 'S', 'I', 'A'], widths);

    for (const [i, r] of rows.entries()) {
      if (y > doc.page.height - 60) { doc.addPage(); y = doc.y; }
      const map = { 1: ['H', '#90ee90'], 2: ['S', '#ffff00'], 3: ['I', '#ffff00'], 4: ['A', '#ff6b6b'] };
      const harianCells = r.harian.map((h) => (h.lewat ? '' : (map[h.id_kehadiran]?.[0] || 'A')));
      const harianBg = r.harian.map((h) => (h.lewat ? null : (map[h.id_kehadiran]?.[1] || '#ff6b6b')));
      drawRow(
        [i + 1, r.guru.nama_guru, ...harianCells, r.hadir || '-', r.sakit || '-', r.izin || '-', r.alfa || '-'],
        widths,
        { bg: [null, null, ...harianBg, null, null, null, null] }
      );
    }

    doc.moveDown(1);
    doc.fontSize(9).text(`Jumlah guru: ${rekap.total}    Laki-laki: ${rekap.laki}    Perempuan: ${rekap.perempuan}`, startX, y + 10);

    doc.end();
  } catch (err) {
    console.error('exportLaporanGuruPdf error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengekspor laporan PDF.' });
  }
}
