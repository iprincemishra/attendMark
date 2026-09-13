import { Router } from 'express';
import { createAttendanceSession, markAttendance } from '../controllers/attendance.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';

const attendanceRoute = Router();

attendanceRoute.post('/start-session', verifyToken, requireRole('TEACHER'), createAttendanceSession);

attendanceRoute.post('/mark', verifyToken, requireRole('STUDENT'), markAttendance);

export default attendanceRoute;