// ============================================================
// Konstanta & Enum
// ============================================================

export const Kehadiran = {
  Hadir: 1,
  Sakit: 2,
  Izin: 3,
  TanpaKeterangan: 4,
};

export const KehadiranLabel = {
  1: 'Hadir',
  2: 'Sakit',
  3: 'Izin',
  4: 'Tanpa keterangan',
};

export const TipeUser = {
  Siswa: 'siswa',
  Guru: 'guru',
};

// ── Permission matrix, mengikuti app/Config/AuthGroups.php pada project asli ──
export const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard.view-admin', 'admin.access',
    'students.manage', 'teachers.manage', 'classes.manage',
    'attendance.edit', 'attendance.view',
    'qr.generate', 'petugas.manage', 'settings.manage', 'backup.manage',
    'teacher.access',
  ],
  admin: [
    'dashboard.view-admin', 'admin.access',
    'attendance.edit', 'attendance.view', 'qr.generate',
  ],
  kepsek: [
    'dashboard.view-admin', 'admin.access', 'attendance.view',
  ],
  scanner: [
    'admin.access', 'attendance.view',
  ],
  guru: [
    'teacher.access', 'attendance.edit', 'attendance.view',
  ],
};

export const ROLE_LABELS = {
  superadmin: 'Super Administrator',
  admin: 'Staf Petugas',
  kepsek: 'Kepala Sekolah',
  scanner: 'Petugas Scanner',
  guru: 'Guru / Wali Kelas',
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}
