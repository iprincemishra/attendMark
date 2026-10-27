import { Router } from 'express';
import { createAttendanceSession, exportSubjectAttendance, getSessionAttendance, getStudentAttendanceHistory, getSubjectByYear, markAttendance } from '../controllers/attendance.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const attendanceRoute: Router = Router();

attendanceRoute.post('/start-session', verifyToken, requireRole('TEACHER'), createAttendanceSession);

attendanceRoute.post('/mark', verifyToken, requireRole('STUDENT'), markAttendance);

attendanceRoute.get('/history', verifyToken, requireRole('STUDENT'), getStudentAttendanceHistory);

attendanceRoute.get('/subjects/:year', verifyToken, requireRole('TEACHER'), getSubjectByYear);
attendanceRoute.get('/export', verifyToken, requireRole('TEACHER'), exportSubjectAttendance);

attendanceRoute.get('/:sessionId', verifyToken, requireRole('TEACHER'), getSessionAttendance);


export default attendanceRoute;