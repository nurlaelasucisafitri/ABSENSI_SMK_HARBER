// Menentukan warna sidebar berdasarkan konteks halaman aktif,
// meniru logic app/Views/templates/sidebar.php pada project asli.
export function getSidebarColor(context) {
  switch (context) {
    case 'absen-siswa':
    case 'siswa':
    case 'kelas':
      return 'purple';
    case 'absen-guru':
    case 'guru':
      return 'green';
    case 'admin-qr':
    case 'backup':
    case 'teacher-qr':
      return 'danger';
    default:
      return 'azure';
  }
}

export const SIDEBAR_COLOR_HEX = {
  purple: { bg: '#9c27b0', shadow: 'rgba(156, 39, 176, 0.4)' },
  azure: { bg: '#00bcd4', shadow: 'rgba(0, 188, 212, 0.4)' },
  green: { bg: '#4caf50', shadow: 'rgba(76, 175, 80, 0.4)' },
  danger: { bg: '#f44336', shadow: 'rgba(244, 67, 54, 0.4)' },
};

// Menu admin, lengkap dengan permission yang dibutuhkan
export const ADMIN_MENUS = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: 'dashboard', context: 'admin-dashboard', perm: 'admin.access' },
  { title: 'Absensi Siswa', url: '/admin/absen-siswa', icon: 'checklist', context: 'absen-siswa', perm: 'attendance.edit' },
  { title: 'Absensi Guru', url: '/admin/absen-guru', icon: 'checklist', context: 'absen-guru', perm: 'attendance.edit' },
  { title: 'Data Siswa', url: '/admin/siswa', icon: 'person', context: 'siswa', perm: 'students.manage' },
  { title: 'Data Guru', url: '/admin/guru', icon: 'person_4', context: 'guru', perm: 'teachers.manage' },
  { title: 'Data Kelas & Jurusan', url: '/admin/kelas', icon: 'school', context: 'kelas', perm: 'classes.manage' },
  { title: 'Generate QR Code', url: '/admin/generate', icon: 'qr_code', context: 'admin-qr', perm: 'qr.generate' },
  { title: 'Generate Laporan', url: '/admin/laporan', icon: 'print', context: 'laporan', perm: 'attendance.view' },
  { title: 'Data Petugas', url: '/admin/petugas', icon: 'computer', context: 'petugas', perm: 'petugas.manage' },
  { title: 'Pengaturan', url: '/admin/general-settings', icon: 'settings', context: 'general_settings', perm: 'settings.manage' },
  { title: 'Backup & Restore', url: '/admin/backup', icon: 'backup', context: 'backup', perm: 'backup.manage' },
];

// Menu Wali Kelas (guru)
export const TEACHER_MENUS = [
  { title: 'Dashboard Wali Kelas', url: '/teacher/dashboard', icon: 'dashboard', context: 'teacher-dashboard' },
  { title: 'Laporan Kelas', url: '/teacher/laporan', icon: 'print', context: 'teacher-laporan' },
  { title: 'QR Code Siswa', url: '/teacher/qr', icon: 'qr_code', context: 'teacher-qr' },
  { title: 'Manajemen Kehadiran', url: '/teacher/attendance', icon: 'event_note', context: 'teacher-attendance' },
];

export function getMenusForUser(user) {
  if (!user) return { teacherMenus: [], adminMenus: [], showHeaders: false };

  const teacherMenus = user.is_wali_kelas ? TEACHER_MENUS : [];
  const adminMenus = ADMIN_MENUS.filter((m) => hasPermissionClient(user.role, m.perm));
  const showHeaders = teacherMenus.length > 0 && adminMenus.length > 0;

  return { teacherMenus, adminMenus, showHeaders };
}

const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard.view-admin', 'admin.access', 'students.manage', 'teachers.manage', 'classes.manage',
    'attendance.edit', 'attendance.view', 'qr.generate', 'petugas.manage', 'settings.manage', 'backup.manage', 'teacher.access',
  ],
  admin: ['dashboard.view-admin', 'admin.access', 'attendance.edit', 'attendance.view', 'qr.generate'],
  kepsek: ['dashboard.view-admin', 'admin.access', 'attendance.view'],
  scanner: ['admin.access', 'attendance.view'],
  guru: ['teacher.access', 'attendance.edit', 'attendance.view'],
};

export function hasPermissionClient(role, perm) {
  return (ROLE_PERMISSIONS[role] || []).includes(perm);
}
