import { Router } from 'express';
import { createAttendanceSession, getSessionAttendance, markAttendance } from '../controllers/attendance.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const attendanceRoute = Router();

attendanceRoute.post('/start-session', verifyToken, requireRole('TEACHER'), createAttendanceSession);

attendanceRoute.get('/:sessionId', verifyToken, requireRole('TEACHER'), getSessionAttendance);

attendanceRoute.post('/mark', verifyToken, requireRole('STUDENT'), markAttendance);

export default attendanceRoute;