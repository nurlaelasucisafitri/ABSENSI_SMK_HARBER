-- ============================================================
-- Skema Database - Sistem Absensi Sekolah (versi React + Node.js)
-- SMK Harapan Bersama Kota Tegal
--
-- Tabel data inti (tb_*) dipertahankan SAMA seperti database asli
-- (db_absensi.sql) agar data lama tetap kompatibel.
-- Tabel auth CodeIgniter Shield (auth_*, settings, migrations)
-- disederhanakan menjadi satu tabel `app_users` agar mudah
-- dikelola oleh backend Express + JWT.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Tabel referensi kehadiran (Hadir/Sakit/Izin/Tanpa keterangan)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_kehadiran` (
  `id_kehadiran` int(11) NOT NULL AUTO_INCREMENT,
  `kehadiran` enum('Hadir','Sakit','Izin','Tanpa keterangan') NOT NULL,
  PRIMARY KEY (`id_kehadiran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Jurusan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_jurusan` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `jurusan` varchar(32) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jurusan` (`jurusan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Guru
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_guru` (
  `id_guru` int(11) NOT NULL AUTO_INCREMENT,
  `nuptk` varchar(24) NOT NULL,
  `nama_guru` varchar(255) NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `alamat` text NOT NULL,
  `no_hp` varchar(32) NOT NULL,
  `unique_code` varchar(64) NOT NULL,
  `rfid_code` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_guru`),
  UNIQUE KEY `unique_code` (`unique_code`),
  KEY `idx_tb_guru_rfid_code` (`rfid_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Kelas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_kelas` (
  `id_kelas` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tingkat` varchar(10) NOT NULL,
  `id_jurusan` int(11) UNSIGNED NOT NULL,
  `index_kelas` varchar(5) NOT NULL,
  `id_wali_kelas` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_kelas`),
  KEY `tb_kelas_id_jurusan_foreign` (`id_jurusan`),
  KEY `fk_tb_kelas_id_wali_kelas` (`id_wali_kelas`),
  CONSTRAINT `tb_kelas_id_jurusan_foreign` FOREIGN KEY (`id_jurusan`) REFERENCES `tb_jurusan` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_tb_kelas_id_wali_kelas` FOREIGN KEY (`id_wali_kelas`) REFERENCES `tb_guru` (`id_guru`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Siswa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_siswa` (
  `id_siswa` int(11) NOT NULL AUTO_INCREMENT,
  `nis` varchar(16) NOT NULL,
  `nama_siswa` varchar(255) NOT NULL,
  `id_kelas` int(11) UNSIGNED NOT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `no_hp` varchar(32) NOT NULL,
  `unique_code` varchar(64) NOT NULL,
  `rfid_code` varchar(100) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_siswa`),
  UNIQUE KEY `unique_code` (`unique_code`),
  KEY `id_kelas` (`id_kelas`),
  KEY `idx_tb_siswa_rfid_code` (`rfid_code`),
  CONSTRAINT `tb_siswa_id_kelas_foreign` FOREIGN KEY (`id_kelas`) REFERENCES `tb_kelas` (`id_kelas`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Presensi siswa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_presensi_siswa` (
  `id_presensi` int(11) NOT NULL AUTO_INCREMENT,
  `id_siswa` int(11) NOT NULL,
  `id_kelas` int(11) UNSIGNED DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `id_kehadiran` int(11) NOT NULL,
  `keterangan` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_presensi`),
  KEY `id_siswa` (`id_siswa`),
  KEY `id_kelas` (`id_kelas`),
  KEY `id_kehadiran` (`id_kehadiran`),
  CONSTRAINT `tb_presensi_siswa_id_siswa_foreign` FOREIGN KEY (`id_siswa`) REFERENCES `tb_siswa` (`id_siswa`) ON DELETE CASCADE,
  CONSTRAINT `tb_presensi_siswa_id_kelas_foreign` FOREIGN KEY (`id_kelas`) REFERENCES `tb_kelas` (`id_kelas`) ON DELETE CASCADE,
  CONSTRAINT `tb_presensi_siswa_id_kehadiran_foreign` FOREIGN KEY (`id_kehadiran`) REFERENCES `tb_kehadiran` (`id_kehadiran`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Presensi guru
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_presensi_guru` (
  `id_presensi` int(11) NOT NULL AUTO_INCREMENT,
  `id_guru` int(11) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jam_masuk` time DEFAULT NULL,
  `jam_keluar` time DEFAULT NULL,
  `id_kehadiran` int(11) NOT NULL,
  `keterangan` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id_presensi`),
  KEY `id_guru` (`id_guru`),
  KEY `id_kehadiran` (`id_kehadiran`),
  CONSTRAINT `tb_presensi_guru_id_guru_foreign` FOREIGN KEY (`id_guru`) REFERENCES `tb_guru` (`id_guru`) ON DELETE CASCADE,
  CONSTRAINT `tb_presensi_guru_id_kehadiran_foreign` FOREIGN KEY (`id_kehadiran`) REFERENCES `tb_kehadiran` (`id_kehadiran`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Pengaturan umum sekolah
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `general_settings` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `logo` varchar(225) DEFAULT NULL,
  `school_name` varchar(225) DEFAULT 'SMK 1 Indonesia',
  `school_year` varchar(225) DEFAULT '2024/2025',
  `copyright` varchar(225) DEFAULT '© 2025 All rights reserved.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Pengguna aplikasi (login) - menggantikan users + auth_identities
-- + auth_groups_users dari CodeIgniter Shield dengan satu tabel
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_users` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_guru` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('superadmin','admin','kepsek','scanner','guru') NOT NULL DEFAULT 'admin',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `last_active` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_app_users_id_guru` (`id_guru`),
  CONSTRAINT `fk_app_users_id_guru` FOREIGN KEY (`id_guru`) REFERENCES `tb_guru` (`id_guru`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DATA AWAL (default reference + seed)
-- ============================================================

INSERT INTO `tb_kehadiran` (`id_kehadiran`, `kehadiran`) VALUES
(1, 'Hadir'), (2, 'Sakit'), (3, 'Izin'), (4, 'Tanpa keterangan')
ON DUPLICATE KEY UPDATE kehadiran = VALUES(kehadiran);

INSERT INTO `general_settings` (`id`, `logo`, `school_name`, `school_year`, `copyright`) VALUES
(1, NULL, 'SMK Harapan Bersama Tegal', '2024/2025', '© 2025 All rights reserved.')
ON DUPLICATE KEY UPDATE school_name = VALUES(school_name);

-- Akun superadmin default. Password: admin123 (bcrypt hash di-generate oleh seed.js)
-- Lihat backend/src/seed.js untuk pembuatan akun otomatis.
