import { Response } from "express";
import { IApiResponse } from "../types/response.types";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import crypto from 'crypto'

export const createAttendanceSession = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const { subject, durationMinutes = 5 } = req.body

        const teacherId = req.user?.userId

        if (!subject) {
            return res.status(400).json({
                success: false,
                message: "Subject name is required"
            })
        }

        const token = crypto.randomBytes(16).toString('hex')
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

        const session = await prisma.session.create({
            data: {
                teacherId: teacherId!,
                subject,
                token,
                expiresAt
            }
        })

        return res.status(201).json({
            success: true,
            message: 'Attendance session started successfully',
            data: {
                sessionId: session.id,
                subject: session.subject,
                token: session.token,
                expiresAt: session.expiresAt,
            }
        })

    } catch (error: any) {
        console.error('Create session error: ', error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })

    }
}

export const markAttendance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const studentId = req.user?.userId;

        const { sessionId, token, deviceId, timestamp } = req.body;

        if (!sessionId || !token || !deviceId || !timestamp) {
            return res.status(400).json({
                success: false,
                message: 'Session ID, token, deviceId, and timestamp are required'
            });
        }

        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student || student.role !== 'STUDENT') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized student account'
            });
        }

        if (student.deviceId !== deviceId) {
            return res.status(403).json({
                success: false,
                message: 'Device binding mismatch! Proxy attendance blocked.'
            });
        }

        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Attendance session not found'
            });
        }

        if (new Date() > session.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Attendance session has expired'
            });
        }

        if (session.token !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired BLE rotating token'
            });
        }

        const existingAttendance = await prisma.attendance.findFirst({
            where: { sessionId, studentId },
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this session'
            });
        }

        const scanTime = new Date(timestamp);
        if (isNaN(scanTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid timestamp format'
            });
        }

        const attendance = await prisma.attendance.create({
            data: {
                sessionId: sessionId!,
                studentId: studentId!,
                timestamp: scanTime,
                status: 'PRESENT',
            },
        });

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully!',
            data: attendance,
        });

    } catch (error: any) {
        console.error('Mark attendance error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }

}