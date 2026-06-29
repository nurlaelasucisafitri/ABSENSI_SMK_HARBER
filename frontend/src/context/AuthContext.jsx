import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('absensi_token');
    const storedUser = localStorage.getItem('absensi_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Verifikasi token masih valid & refresh data user
      api.get('/auth/me')
        .then((res) => {
          const updatedUser = { ...JSON.parse(storedUser), ...res.data.user };
          setUser(updatedUser);
          localStorage.setItem('absensi_user', JSON.stringify(updatedUser));
        })
        .catch(() => {
          localStorage.removeItem('absensi_token');
          localStorage.removeItem('absensi_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('absensi_token', token);
    localStorage.setItem('absensi_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  function logout() {
    localStorage.removeItem('absensi_token');
    localStorage.removeItem('absensi_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
