import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'db_absensi';

  console.log(`→ Memastikan database "${dbName}" tersedia...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
  await connection.query(`USE \`${dbName}\``);

  console.log('→ Menjalankan schema.sql...');
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
  await connection.query(schemaSql);

  console.log('→ Memeriksa akun superadmin default...');
  const [rows] = await connection.query('SELECT id FROM app_users WHERE email = ?', ['adminsuper@gmail.com']);

  if (rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      `INSERT INTO app_users (username, email, password, role, active, created_at, updated_at)
       VALUES (?, ?, ?, 'superadmin', 1, NOW(), NOW())`,
      ['superadmin', 'adminsuper@gmail.com', hashedPassword]
    );
    console.log('✓ Akun superadmin dibuat:');
    console.log('   Email    : adminsuper@gmail.com');
    console.log('   Password : admin123');
    console.log('   (Silakan segera ganti password setelah login pertama kali)');
  } else {
    console.log('✓ Akun superadmin sudah ada, dilewati.');
  }

  await connection.end();
  console.log('\n✓ Seeding selesai. Database siap digunakan.');
}

main().catch((err) => {
  console.error('✗ Gagal melakukan seeding:', err);
  process.exit(1);
});
