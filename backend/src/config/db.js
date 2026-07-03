import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Coba baca CA certificate untuk koneksi SSL (wajib untuk Aiven)
function getSSLConfig() {
  try {
    const caPath = path.join(process.cwd(), 'ca.pem');
    if (fs.existsSync(caPath)) {
      return { ca: fs.readFileSync(caPath) };
    }
  } catch {}
  return undefined;
}

const ssl = getSSLConfig();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_absensi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: ssl,
});

export default pool;