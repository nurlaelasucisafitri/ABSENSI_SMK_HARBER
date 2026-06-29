import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ context, title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar context={context} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="app-main">
        <Navbar title={title} onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
