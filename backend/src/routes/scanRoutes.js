import express from 'express';
import { cekKode } from '../controllers/scanController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Scan tetap memerlukan login (petugas/scanner/admin), tapi tidak butuh permission spesifik
router.post('/cek', authenticate, cekKode);

export default router;
