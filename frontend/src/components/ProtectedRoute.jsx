import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermissionClient } from '../utils/sidebarConfig';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullpage-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermissionClient(user.role, permission)) {
    return (
      <div className="fullpage-loader" style={{ flexDirection: 'column', gap: 12 }}>
        <h3>Akses Ditolak</h3>
        <p className="text-muted">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
      </div>
    );
  }

  return children;
}
