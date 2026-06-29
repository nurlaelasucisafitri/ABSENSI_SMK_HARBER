import crypto from 'crypto';

/**
 * Generate token unik untuk unique_code siswa/guru (digunakan sebagai isi QR Code).
 * Mengikuti pola asli: uniqid + random number, di sini diganti dengan
 * kombinasi timestamp base36 + random hex agar tetap unik dan singkat.
 */
export function generateToken() {
  const ts = Date.now().toString(36);
  const rand1 = crypto.randomBytes(6).toString('hex');
  const rand2 = Math.floor(10000000 + Math.random() * 89999999);
  return `${ts}${rand1}-${rand2}`;
}
