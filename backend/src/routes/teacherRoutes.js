import express from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as teacherCtrl from '../controllers/teacherController.js';

const router = express.Router();

router.use(authenticate, requirePermission('teacher.access'));

router.get('/dashboard', teacherCtrl.getTeacherDashboard);
router.get('/attendance', teacherCtrl.getTeacherAttendancePage);
router.post('/attendance/get-list', teacherCtrl.getTeacherAttendanceList);
router.post('/attendance/update-single', teacherCtrl.updateTeacherAttendance);
router.get('/qr', teacherCtrl.getTeacherQrPage);
router.get('/laporan', teacherCtrl.getTeacherReportsPage);

export default router;
