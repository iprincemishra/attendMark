import { Response } from "express";
import { IApiResponse } from "../types/response.types.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import prisma from "../config/db.js";
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

        const sessionCode = crypto.randomBytes(4).toString('hex').toUpperCase()
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

        const session = await prisma.session.create({
            data: {
                teacherId: teacherId!,
                subject,
                sessionCode,
                expiresAt
            }
        })

        return res.status(201).json({
            success: true,
            message: 'Attendance session started successfully',
            data: {
                sessionId: session.id,
                subject: session.subject,
                sessionCode: session.sessionCode,
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

export const markAttendance = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const studentId = req.user?.userId;

        const { sessionCode, deviceId, timestamp } = req.body;

        if (!sessionCode || !deviceId || !timestamp) {
            return res.status(400).json({
                success: false,
                message: 'sessionCode, deviceId, and timestamp are required'
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

        const session = await prisma.session.findUnique({ where: { sessionCode } });
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

        const existingAttendance = await prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId },
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this session'
            });
        }

        const parsedTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
        const scanTime = new Date(parsedTimestamp);
        if (isNaN(scanTime.getTime()) || parsedTimestamp < 1000000000000) {
            return res.status(400).json({
                success: false,
                message: 'Invalid timestamp format. Send valid milliseconds (Date.now()) or ISO string.'
            });
        }

        const attendance = await prisma.attendance.create({
            data: {
                sessionId: session.id,
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

export const getSessionAttendance = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const teacherId = req.user?.userId

        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            })
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId as string },
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.teacherId !== teacherId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You did not create this session'
            });
        }
        const totalStudents = await prisma.user.count({
            where: { role: 'STUDENT' },
        })

        const attendanceRecords = await prisma.attendance.findMany({
            where: { sessionId: sessionId as string },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        rollNumber: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        })

        return res.status(200).json({
            success: true,
            message: "Session attendance fetched successfully",
            data: {
                sessionId,
                subject: session.subject,
                totalPresent: attendanceRecords.length,
                attendance: attendanceRecords,
                totalStudents: totalStudents
            }
        })

    } catch (error: any) {
        console.error("Get session attendance error: ", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

export const getStudentAttendanceHistory = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const studentId = req.user?.userId;
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Student ID missing'
            });
        }

        const totalSessionsGrouped = await prisma.session.groupBy({
            by: ['subject'],
            _count: { id: true }
        });

        const attendanceRecords = await prisma.attendance.findMany({
            where: { studentId },
            include: {
                session: {
                    select: {
                        id: true,
                        subject: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
        });

        const subjectBreakdown: Record<string, {
            total: number,
            attended: number,
            skipped: number,
            percentage: string
        }> = {};

        totalSessionsGrouped.forEach((group: any) => {
            subjectBreakdown[group.subject] = {
                total: group._count.id,
                attended: 0,
                skipped: 0,
                percentage: "0.00"
            };
        });

        attendanceRecords.forEach((record: any) => {
            const subject = record.session.subject;
            if (subjectBreakdown[subject]) {
                subjectBreakdown[subject].attended += 1;
            }
        });

        let overallTotal = 0;
        let overallAttended = attendanceRecords.length;

        Object.keys(subjectBreakdown).forEach(subject => {
            const stats = subjectBreakdown[subject];
            stats.skipped = stats.total - stats.attended;
            stats.percentage = ((stats.attended / stats.total) * 100).toFixed(2);

            overallTotal += stats.total;
        });

        const overallPercentage = overallTotal === 0 ? "0.00" : ((overallAttended / overallTotal) * 100).toFixed(2);

        return res.status(200).json({
            success: true,
            message: 'Student attendance history fetched successfully',
            data: {
                overall: {
                    totalClassesHeld: overallTotal,
                    classesAttended: overallAttended,
                    skippedClasses: overallTotal - overallAttended,
                    percentage: `${overallPercentage}%`
                },
                subjectWise: subjectBreakdown,
                recentHistory: attendanceRecords
            },
        });
    } catch (error: any) {
        console.error('Get student history error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};