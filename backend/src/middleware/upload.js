import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadsRoot = path.join(process.cwd(), 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function makeStorage(subfolder) {
  const dir = path.join(uploadsRoot, subfolder);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const randomName = crypto.randomBytes(16).toString('hex') + ext;
      cb(null, randomName);
    },
  });
}

export const uploadSiswaFoto = multer({ storage: makeStorage('siswa'), limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadLogo = multer({ storage: makeStorage('logo'), limits: { fileSize: 2 * 1024 * 1024 } });
export const uploadCsv = multer({ storage: makeStorage('tmp'), limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadBackup = multer({ storage: makeStorage('backup'), limits: { fileSize: 50 * 1024 * 1024 } });

export { uploadsRoot };
