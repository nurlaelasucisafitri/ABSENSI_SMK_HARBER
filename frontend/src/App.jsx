import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Scan from './pages/Scan';

import Dashboard from './pages/admin/Dashboard';
import DataSiswa from './pages/admin/DataSiswa';
import DataGuru from './pages/admin/DataGuru';
import DataKelas from './pages/admin/DataKelas';
import AbsenSiswa from './pages/admin/AbsenSiswa';
import AbsenGuru from './pages/admin/AbsenGuru';
import GenerateQR from './pages/admin/GenerateQR';
import GenerateLaporan from './pages/admin/GenerateLaporan';
import DataPetugas from './pages/admin/DataPetugas';
import GeneralSettings from './pages/admin/GeneralSettings';
import Backup from './pages/admin/Backup';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherQr from './pages/teacher/TeacherQr';
import TeacherLaporan from './pages/teacher/TeacherLaporan';

import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/login.css';
import './styles/scan.css';
import './styles/extra.css';

function AdminPage({ context, title, permission, children }) {
  return (
    <ProtectedRoute permission={permission}>
      <AppLayout context={context} title={title}>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="fullpage-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'guru' && user.is_wali_kelas) return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'scanner') return <Navigate to="/scan" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scan" element={<ProtectedRoute><ErrorBoundary><Scan /></ErrorBoundary></ProtectedRoute>} />

          {/* ── Admin routes ── */}
          <Route path="/admin/dashboard" element={<AdminPage context="admin-dashboard" title="Dashboard" permission="admin.access"><Dashboard /></AdminPage>} />
          <Route path="/admin/siswa" element={<AdminPage context="siswa" title="Data Siswa" permission="students.manage"><DataSiswa /></AdminPage>} />
          <Route path="/admin/guru" element={<AdminPage context="guru" title="Data Guru" permission="teachers.manage"><DataGuru /></AdminPage>} />
          <Route path="/admin/kelas" element={<AdminPage context="kelas" title="Data Kelas & Jurusan" permission="classes.manage"><DataKelas /></AdminPage>} />
          <Route path="/admin/absen-siswa" element={<AdminPage context="absen-siswa" title="Absensi Siswa" permission="attendance.edit"><AbsenSiswa /></AdminPage>} />
          <Route path="/admin/absen-guru" element={<AdminPage context="absen-guru" title="Absensi Guru" permission="attendance.edit"><AbsenGuru /></AdminPage>} />
          <Route path="/admin/generate" element={<AdminPage context="admin-qr" title="Generate QR Code" permission="qr.generate"><GenerateQR /></AdminPage>} />
          <Route path="/admin/laporan" element={<AdminPage context="laporan" title="Generate Laporan" permission="attendance.view"><GenerateLaporan /></AdminPage>} />
          <Route path="/admin/petugas" element={<AdminPage context="petugas" title="Data Petugas" permission="petugas.manage"><DataPetugas /></AdminPage>} />
          <Route path="/admin/general-settings" element={<AdminPage context="general_settings" title="Pengaturan Utama" permission="settings.manage"><GeneralSettings /></AdminPage>} />
          <Route path="/admin/backup" element={<AdminPage context="backup" title="Backup & Restore" permission="backup.manage"><Backup /></AdminPage>} />

          {/* ── Teacher (Wali Kelas) routes ── */}
          <Route path="/teacher/dashboard" element={<AdminPage context="teacher-dashboard" title="Dashboard Wali Kelas" permission="teacher.access"><TeacherDashboard /></AdminPage>} />
          <Route path="/teacher/attendance" element={<AdminPage context="teacher-attendance" title="Manajemen Kehadiran" permission="teacher.access"><TeacherAttendance /></AdminPage>} />
          <Route path="/teacher/qr" element={<AdminPage context="teacher-qr" title="QR Code Siswa" permission="teacher.access"><TeacherQr /></AdminPage>} />
          <Route path="/teacher/laporan" element={<AdminPage context="teacher-laporan" title="Laporan Kelas" permission="teacher.access"><TeacherLaporan /></AdminPage>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="fullpage-loader" style={{ flexDirection: 'column', gap: 10 }}>
      <h2>404</h2>
      <p className="text-muted">Halaman tidak ditemukan.</p>
    </div>
  );
}
