import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ScanLine, UserCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_BADGE_COLOR = {
  superadmin: '#f44336',
  admin: '#4caf50',
  kepsek: '#ff9800',
  scanner: '#00bcd4',
  guru: '#9e9e9e',
};

export default function Navbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scanRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (scanRef.current && !scanRef.current.contains(e.target)) setScanOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="app-navbar">
      <button className="navbar-burger" onClick={onMenuClick} aria-label="Buka menu"><Menu size={22} /></button>
      <p className="navbar-title">{title}</p>

      <div className="navbar-right">
        <div className="navbar-dropdown" ref={scanRef}>
          <button className="navbar-icon-btn" onClick={() => setScanOpen((v) => !v)} aria-label="Menu scan">
            <ScanLine size={18} /> <span className="navbar-icon-label">Scan</span>
          </button>
          {scanOpen && (
            <div className="dropdown-menu">
              <a className="dropdown-item" href="/scan?mode=masuk" onClick={(e) => { e.preventDefault(); navigate('/scan?mode=masuk'); setScanOpen(false); }}>Absen masuk</a>
              <a className="dropdown-item" href="/scan?mode=pulang" onClick={(e) => { e.preventDefault(); navigate('/scan?mode=pulang'); setScanOpen(false); }}>Absen pulang</a>
            </div>
          )}
        </div>

        <div className="navbar-dropdown" ref={profileRef}>
          <button className="navbar-icon-btn" onClick={() => setProfileOpen((v) => !v)} aria-label="Menu akun" style={{ color: user?.role === 'superadmin' ? '#f44336' : undefined }}>
            <UserCircle2 size={18} /> <span className="navbar-icon-label">{user?.username}</span>
          </button>
          {profileOpen && (
            <div className="dropdown-menu dropdown-menu-right">
              <div className="dropdown-item dropdown-item-static">Email: {user?.email}</div>
              <div className="dropdown-item dropdown-item-static">
                <div>Role:</div>
                <span className="role-badge" style={{ background: ROLE_BADGE_COLOR[user?.role] || '#999' }}>
                  {user?.roleLabel}
                </span>
                {user?.is_wali_kelas && <span className="role-badge" style={{ background: '#2196f3' }}>Wali Kelas</span>}
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item-button" onClick={handleLogout}>
                <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
