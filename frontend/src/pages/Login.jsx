import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const redirectTo = location.state?.from || (user.role === 'guru' && user.is_wali_kelas ? '/teacher/dashboard' : '/admin/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) setErrors(res.errors);
      setGeneralError(res?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <h4>Login</h4>
          <p>Silahkan masukkan email dan password anda</p>
        </div>
        <div className="login-card-body">
          {generalError && <div className="alert alert-danger">{generalError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.login || errors.email ? 'is-invalid' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {(errors.login || errors.email) && <div className="form-error">{errors.login || errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
