import QRCode from 'qrcode';
import archiver from 'archiver';
import pool from '../config/db.js';

const COLOR_SISWA = '#2c49a2';
const COLOR_GURU = '#1c655a';

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Generate SVG QR Code lengkap dengan label nama di bawahnya.
 * Pendekatan: render QR sebagai path SVG via library `qrcode`, lalu
 * bungkus dalam SVG yang lebih besar dengan teks label di bawah (mirip
 * output endroid/qr-code pada project asli, tanpa perlu native canvas).
 */
async function buildQrSvg(uniqueCode, label, color) {
  const qrSvgRaw = await QRCode.toString(uniqueCode, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: { dark: color, light: '#FFFFFFFF' },
  });

  // Ambil hanya isi <svg>...</svg> bagian dalam (path-nya) untuk digabung ulang
  const innerMatch = qrSvgRaw.match(/<svg[^>]*viewBox="0 0 (\d+) (\d+)"[^>]*>([\s\S]*)<\/svg>/);
  const viewBoxSize = innerMatch ? Number(innerMatch[1]) : 300;
  const innerContent = innerMatch ? innerMatch[3] : '';

  const padding = 24;
  const labelHeight = 36;
  const qrDisplaySize = 300;
  const totalSize = qrDisplaySize + padding * 2;
  const totalHeight = totalSize + labelHeight;

  const escapedLabel = String(label).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalHeight}" viewBox="0 0 ${totalSize} ${totalHeight}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <g transform="translate(${padding}, ${padding}) scale(${qrDisplaySize / viewBoxSize})">
      ${innerContent}
    </g>
    <text x="${totalSize / 2}" y="${qrDisplaySize + padding + 24}" font-family="Roboto, Arial, sans-serif" font-size="16" font-weight="600" fill="${color}" text-anchor="middle">${escapedLabel}</text>
  </svg>`;
}

export async function getSiswaByKelas(req, res) {
  try {
    const idKelas = req.body.idKelas || req.query.idKelas;
    let query = `SELECT s.* FROM tb_siswa s WHERE 1=1`;
    const params = [];
    if (idKelas) {
      query += ' AND s.id_kelas = ?';
      params.push(idKelas);
    }
    query += ' ORDER BY s.nama_siswa';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getSiswaByKelas error:', err);
    res.status(500).json([]);
  }
}

export async function viewQrSiswa(req, res) {
  try {
    const [[siswa]] = await pool.query('SELECT * FROM tb_siswa WHERE id_siswa = ?', [req.params.id]);
    if (!siswa) return res.status(404).send('Data siswa tidak ditemukan');
    const svg = await buildQrSvg(siswa.unique_code, siswa.nama_siswa, COLOR_SISWA);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error('viewQrSiswa error:', err);
    res.status(500).send('Gagal membuat QR code');
  }
}

export async function downloadQrSiswa(req, res) {
  try {
    const [[siswa]] = await pool.query('SELECT * FROM tb_siswa WHERE id_siswa = ?', [req.params.id]);
    if (!siswa) return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
    const svg = await buildQrSvg(siswa.unique_code, siswa.nama_siswa, COLOR_SISWA);
    const filename = `${slugify(siswa.nama_siswa)}_${slugify(siswa.nis)}.svg`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(svg);
  } catch (err) {
    console.error('downloadQrSiswa error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat QR code' });
  }
}

export async function downloadAllQrSiswa(req, res) {
  try {
    const idKelas = req.query.id_kelas;
    let query = 'SELECT * FROM tb_siswa';
    const params = [];
    if (idKelas) { query += ' WHERE id_kelas = ?'; params.push(idKelas); }

    const [siswaList] = await pool.query(query, params);
    if (siswaList.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data siswa.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-siswa.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const siswa of siswaList) {
      const svg = await buildQrSvg(siswa.unique_code, siswa.nama_siswa, COLOR_SISWA);
      archive.append(svg, { name: `${slugify(siswa.nama_siswa)}_${slugify(siswa.nis)}.svg` });
    }

    await archive.finalize();
  } catch (err) {
    console.error('downloadAllQrSiswa error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat arsip QR code' });
  }
}

export async function viewQrGuru(req, res) {
  try {
    const [[guru]] = await pool.query('SELECT * FROM tb_guru WHERE id_guru = ?', [req.params.id]);
    if (!guru) return res.status(404).send('Data guru tidak ditemukan');
    const svg = await buildQrSvg(guru.unique_code, guru.nama_guru, COLOR_GURU);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error('viewQrGuru error:', err);
    res.status(500).send('Gagal membuat QR code');
  }
}

export async function downloadQrGuru(req, res) {
  try {
    const [[guru]] = await pool.query('SELECT * FROM tb_guru WHERE id_guru = ?', [req.params.id]);
    if (!guru) return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan' });
    const svg = await buildQrSvg(guru.unique_code, guru.nama_guru, COLOR_GURU);
    const filename = `${slugify(guru.nama_guru)}_${slugify(guru.nuptk)}.svg`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(svg);
  } catch (err) {
    console.error('downloadQrGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat QR code' });
  }
}

export async function downloadAllQrGuru(req, res) {
  try {
    const [guruList] = await pool.query('SELECT * FROM tb_guru');
    if (guruList.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data guru.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-guru.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const guru of guruList) {
      const svg = await buildQrSvg(guru.unique_code, guru.nama_guru, COLOR_GURU);
      archive.append(svg, { name: `${slugify(guru.nama_guru)}_${slugify(guru.nuptk)}.svg` });
    }

    await archive.finalize();
  } catch (err) {
    console.error('downloadAllQrGuru error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat arsip QR code' });
  }
}
