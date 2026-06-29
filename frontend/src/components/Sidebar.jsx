import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardCheck, GraduationCap, UserRound, School,
  QrCode, Printer, Monitor, Settings, DatabaseBackup, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSidebarColor, SIDEBAR_COLOR_HEX, getMenusForUser } from '../utils/sidebarConfig';
import { useGeneralSettings } from '../hooks/useGeneralSettings';

const ICONS = {
  dashboard: LayoutDashboard,
  checklist: ClipboardCheck,
  person: GraduationCap,
  person_4: UserRound,
  school: School,
  qr_code: QrCode,
  print: Printer,
  computer: Monitor,
  settings: Settings,
  backup: DatabaseBackup,
  event_note: CalendarCheck,
};

function MenuIcon({ name }) {
  const IconComponent = ICONS[name] || LayoutDashboard;
  return <IconComponent size={19} strokeWidth={2} className="sidebar-icon" />;
}

export default function Sidebar({ context, mobileOpen, onClose }) {
  const { user } = useAuth();
  const { settings } = useGeneralSettings();
  const sidebarColor = getSidebarColor(context);
  const colorHex = SIDEBAR_COLOR_HEX[sidebarColor];
  const { teacherMenus, adminMenus, showHeaders } = getMenusForUser(user);

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ '--active-bg': colorHex.bg, '--active-shadow': colorHex.shadow }}>
        <div className="sidebar-logo">
          <strong>{user?.roleLabel}</strong>
          <small>{settings?.school_name || 'SMK Harapan Bersama Tegal'}</small>
        </div>
        <nav className="sidebar-nav">
          {showHeaders && <p className="sidebar-section-title">Wali Kelas</p>}
          {teacherMenus.map((item) => (
            <NavLink key={item.url} to={item.url} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <MenuIcon name={item.icon} />
              <span>{item.title}</span>
            </NavLink>
          ))}

          {showHeaders && <p className="sidebar-section-title">Admin</p>}
          {adminMenus.map((item) => (
            <NavLink key={item.url} to={item.url} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <MenuIcon name={item.icon} />
              <span>{item.title}</span>
            </NavLink>
          ))}

          {teacherMenus.length === 0 && adminMenus.length === 0 && (
            <NavLink to="/scan" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
              <MenuIcon name="qr_code" />
              <span>Scan QR</span>
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}
