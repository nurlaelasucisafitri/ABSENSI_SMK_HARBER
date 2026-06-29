# Sistem Absensi Sekolah Berbasis QR Code & RFID
### SMK Harapan Bersama Kota Tegal

Aplikasi web untuk mengelola presensi siswa dan guru menggunakan QR Code / RFID,
dengan notifikasi WhatsApp otomatis ke orang tua setiap kali siswa melakukan
absen masuk maupun pulang sekolah.

Proyek ini merupakan migrasi dari versi sebelumnya (PHP CodeIgniter 4 + Docker)
menjadi arsitektur **React (frontend) + Node.js/Express (backend) + MySQL**,
dengan tampilan yang direplikasi seidentik mungkin dengan versi sebelumnya
(tema Material Dashboard) dan skema database yang tetap kompatibel.

---

## 🏗️ Arsitektur

```
project/
├── backend/        → REST API (Node.js + Express + MySQL)
├── frontend/        → Single Page Application (React + Vite)
└── schema.sql        → Skema database (ada di dalam folder backend)
```

| Layer       | Teknologi                                              |
|-------------|---------------------------------------------------------|
| Frontend    | React 19, React Router, Axios, Chart.js, html5-qrcode    |
| Backend     | Node.js, Express, MySQL2, JWT, Multer, PDFKit, Archiver  |
| Database    | MySQL / MariaDB                                          |
| Notifikasi  | WhatsApp via Fonnte API                                  |
| Autentikasi | JSON Web Token (JWT) + bcrypt                             |

---

## ✨ Fitur Utama

- **Login multi-role**: Super Admin, Staf Petugas, Kepala Sekolah, Petugas Scanner, Guru/Wali Kelas
- **Scan QR Code & RFID** untuk presensi masuk/pulang, dengan notifikasi WhatsApp otomatis ke nomor HP orang tua/guru secara real-time
- **Dashboard** dengan grafik kehadiran 7 hari terakhir dan statistik harian
- **CRUD lengkap**: Data Siswa, Data Guru, Kelas, Jurusan, Petugas
- **Generate QR Code** per siswa/guru (unduh satuan atau massal dalam ZIP)
- **Manajemen Kehadiran** harian per kelas (ubah status Hadir/Sakit/Izin/Alfa)
- **Generate Laporan** rekap bulanan (format tabel H/S/I/A), ekspor ke PDF & Word
- **Dashboard Wali Kelas** khusus guru yang menjadi wali kelas
- **Backup & Restore** database (JSON) dan foto siswa (ZIP)
- **Pengaturan umum** sekolah (nama, tahun ajaran, logo)

---

## 🚀 Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js v18 atau lebih baru
- MySQL atau MariaDB (server lokal atau remote)

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit file `.env` sesuaikan dengan kredensial database Anda:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=db_absensi
JWT_SECRET=ganti_dengan_kalimat_acak_yang_panjang
```

Jalankan seed untuk membuat schema database & akun admin default:

```bash
npm run seed
```

Akun default yang dibuat:
```
Email    : adminsuper@gmail.com
Password : admin123
```
**Segera ganti password ini setelah login pertama kali.**

### 1b. (Opsional) Migrasi Data dari Database Lama

Jika Anda memiliki file `db_absensi.sql` dari sistem versi sebelumnya (PHP/CodeIgniter)
dan ingin memindahkan data siswa, guru, kelas, jurusan, riwayat presensi, serta
akun login yang sudah ada, jalankan:

```bash
node src/migrate-old-data.js /path/ke/db_absensi_lama.sql
```

Script ini akan memindahkan seluruh data tersebut ke database baru **tanpa mengubah
password akun lama** (hash password lama tetap kompatibel dan langsung bisa dipakai
untuk login). Foto siswa yang sebelumnya tersimpan perlu disalin manual ke folder
`backend/uploads/siswa/` karena file fisik tidak ikut tersimpan di dalam file SQL.

Jalankan server:

```bash
npm run dev
```

Server berjalan di `http://localhost:4000`.

### 2. Setup Frontend

```bash
cd frontend
npm install
```

Pastikan file `.env` berisi URL backend yang benar:
```env
VITE_API_URL=http://localhost:4000/api
```

Jalankan dev server:

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## 📲 Mengaktifkan Notifikasi WhatsApp (Opsional)

Notifikasi WA menggunakan layanan [Fonnte](https://md.fonnte.com/). Untuk
mengaktifkannya:

1. Daftar dan hubungkan WhatsApp Anda di Fonnte, dapatkan token API.
2. Edit `backend/.env`:
   ```env
   WA_NOTIFICATION=true
   WHATSAPP_PROVIDER=Fonnte
   WHATSAPP_TOKEN=token_anda_dari_fonnte
   ```
3. Restart server backend.

Jika `WA_NOTIFICATION=false`, sistem tetap berjalan normal — notifikasi WA
hanya dilewati (sistem absen tetap tercatat di database).

---

## 🔌 Integrasi Alat RFID

Pembaca kartu RFID yang umum digunakan (seperti modul RC522 + ESP32/Arduino
yang dikonfigurasi sebagai **USB HID keyboard emulator**) akan "mengetik" kode
kartu lalu menekan Enter secara otomatis. Ini compatible langsung dengan
halaman **Scan** pada aplikasi ini:

1. Buka halaman Scan (`/scan`)
2. Centang opsi **RFID**
3. Pastikan kotak input RFID berwarna hijau (status "Siap")
4. Tempelkan kartu RFID — sistem akan otomatis memproses absen

Jika menggunakan modul RFID yang terhubung ke mikrokontroler dengan koneksi
serial/WiFi (bukan USB HID), diperlukan adapter tambahan yang mengirim kode
ke endpoint `POST /api/scan/cek` dengan body `{ unique_code, waktu }` —
silakan sesuaikan firmware mikrokontroler Anda untuk melakukan HTTP request
ke endpoint tersebut menggunakan token API petugas/scanner yang valid.

---

## 🗄️ Struktur Database

Tabel data inti (`tb_siswa`, `tb_guru`, `tb_kelas`, `tb_jurusan`,
`tb_presensi_siswa`, `tb_presensi_guru`, `tb_kehadiran`, `general_settings`)
**identik** dengan skema database project sebelumnya, sehingga data lama
tetap kompatibel.

Tabel autentikasi CodeIgniter Shield yang lama (`users`, `auth_identities`,
`auth_groups_users`, dll) digantikan dengan satu tabel sederhana `app_users`
yang menyimpan kredensial dan role pengguna langsung.

Lihat `backend/schema.sql` untuk definisi lengkap.

---

## 👥 Role & Permission

| Role         | Akses                                                          |
|--------------|------------------------------------------------------------------|
| superadmin   | Akses penuh ke seluruh modul                                     |
| admin        | Dashboard, absensi, generate QR (tanpa kelola data master)        |
| kepsek       | Dashboard & laporan (read-only)                                   |
| scanner      | Hanya halaman Scan untuk presensi                                  |
| guru         | Dashboard, laporan, QR, dan kehadiran khusus kelas yang diampu      |

---

## 📁 Struktur Folder Backend

```
backend/
├── src/
│   ├── config/db.js           → Koneksi pool MySQL
│   ├── controllers/           → Logic setiap modul
│   ├── middleware/            → Auth JWT, permission, upload file
│   ├── routes/                → Definisi endpoint REST API
│   ├── utils/                 → Helper (token, statistik, WhatsApp)
│   ├── seed.js                 → Script inisialisasi database
│   └── server.js               → Entry point Express
├── schema.sql                  → Skema database
└── uploads/                    → Foto siswa & logo (dibuat otomatis)
```

## 📁 Struktur Folder Frontend

```
frontend/
├── src/
│   ├── api/client.js            → Axios instance + interceptor JWT
│   ├── components/              → Sidebar, Navbar, Card, Modal, dll
│   ├── context/AuthContext.jsx  → State login global
│   ├── pages/admin/             → Halaman-halaman admin
│   ├── pages/teacher/           → Halaman-halaman wali kelas
│   ├── pages/Scan.jsx            → Halaman scan QR/RFID
│   ├── pages/Login.jsx
│   └── styles/                   → CSS (replikasi Material Dashboard)
```

---

## 📝 Catatan untuk Laporan PPM

Aplikasi ini dibangun sebagai hasil migrasi dari versi PHP CodeIgniter 4 yang
sebelumnya dijalankan dalam container Docker, menjadi arsitektur modern
berbasis **React + Node.js** sesuai permintaan pembimbing/sekolah, dengan
tetap mempertahankan:
- Seluruh data dan struktur database yang sudah ada
- Tampilan visual (UI/UX) yang identik dengan versi sebelumnya
- Seluruh logika bisnis (alur absensi, notifikasi WA, generate QR, laporan)
