import jwt from 'jsonwebtoken';
import { hasPermission } from '../utils/constants.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Izinkan token via query string untuk kasus <img src> / <a href> yang tidak bisa mengirim header
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Tidak terautentikasi. Silakan login kembali.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, username, role, id_guru }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi telah berakhir. Silakan login kembali.' });
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk melakukan aksi ini.' });
    }
    next();
  };
}
