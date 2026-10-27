import { Response } from "express";
import { IApiResponse } from "../types/response.types.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import prisma from "../config/db.js";
import crypto from 'crypto'
import { Parser } from "json2csv"

export const createAttendanceSession = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const { subject, year } = req.body
        const durationMinutes = Math.min(Math.max(req.body.durationMinutes || 5, 1), 180);

        const teacherId = req.user?.userId

        if (!subject || !year) {
            return res.status(400).json({
                success: false,
                message: "Subject name and year (e.g., BCA3) are required"
            })
        }

        const sessionCode = crypto.randomBytes(4).toString('hex').toUpperCase()
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

        const session = await prisma.session.create({
            data: {
                teacherId: teacherId!,
                subject,
                year,
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
                year: session.year,
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
        const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
        const CLOCK_DRIFT_MARGIN_MS = 60 * 1000;
        const now = new Date();

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

        const syncDeadline = new Date(session.expiresAt.getTime() + SIX_HOURS_MS)
        if (now > syncDeadline) {
            return res.status(400).json({
                success: false,
                message: "Attendance sync window has closed. Entries must be submitted within 6 hours."
            })
        }

        const parsedTimestamp = typeof timestamp === "number"
            ? timestamp
            : new Date(timestamp).getTime();

        const scanTime = new Date(parsedTimestamp)

        if (isNaN(scanTime.getTime()) || parsedTimestamp < 1000000000000) {
            return res.status(400).json({
                success: false,
                message: "Invalid timestamp format. Send valid milliseconds (Date.now()) or ISO string."
            })
        }

        const minAllowedScan = new Date(session.createdAt.getTime() - CLOCK_DRIFT_MARGIN_MS);
        const maxAllowedScan = new Date(session.expiresAt.getTime() + CLOCK_DRIFT_MARGIN_MS);

        if (scanTime < minAllowedScan || scanTime > maxAllowedScan) {
            return res.status(400).json({
                success: false,
                message: "Scanned timestamp does not match the active session window."
            })
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
            where: {
                role: 'STUDENT',
                year: session.year
            },
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
                year: session.year,
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

        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student || !student.year) {
            return res.status(404).json({
                success: false,
                message: 'Student year profile not found'
            });
        }

        const totalSessionsGrouped = await prisma.session.groupBy({
            by: ['subject'],
            where: { year: student.year },
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
        const recentHistory = attendanceRecords.slice(0, 3);

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
                recentHistory
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

export const getSubjectByYear = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {
    try {
        const yearParam = Array.isArray(req.params.year) ? req.params.year[0] : req.params.year;
        const teacherId = req.user?.userId;

        if (!yearParam || !teacherId) {
            return res.status(400).json({
                success: false,
                message: "Year parameter is required"
            })
        }

        const sessions = await prisma.session.findMany({
            where: {
                teacherId,
                year: yearParam
            },
            select: { subject: true },
            distinct: ['subject']
        })

        const subjects = sessions
            .map(s => s.subject)
            .filter((s): s is string => s !== null && s !== undefined);

        if (subjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No subjects found for the given year"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Subjects fetched successfully",
            data: subjects
        });

    } catch (error: any) {
        console.error("Get subjects by year error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

export const exportSubjectAttendance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { year, subject } = req.query;

        if (!year || !subject) {
            return res.status(400).json({ success: false, message: "Year and subject query parameters are required" });
        }

        const students = await prisma.user.findMany({
            where: { role: 'STUDENT', year: String(year) },
            orderBy: { rollNumber: 'asc' }
        })

        const sessions = await prisma.session.findMany({
            where: { year: String(year), subject: String(subject) },
            include: { attendances: true },
            orderBy: { createdAt: "asc" }
        })

        if (sessions.length === 0 || students.length === 0) {
            return res.status(404).json({ success: false, message: "No attendance data or students found for this filter." });
        }

        const csvRows = students.map(student => {
            const row: any = {
                "Roll Number": student.rollNumber,
                "Student Name": student.name,
                "Email": student.email
            }

            let attendedCount = 0
            sessions.forEach(session => {
                const sessionDate = session.createdAt.toISOString().split('T')[0];
                const wasPresent = session.attendances.some(att => att.studentId === student.id)
                row[sessionDate] = wasPresent ? "P" : "A"
                if (wasPresent) attendedCount++
            })

            row["Total Attended"] = attendedCount;
            row["Total Classes"] = sessions.length;
            row["Percentage"] = `${((attendedCount / sessions.length) * 100).toFixed(2)}%`;
            return row;

        })

        const fields = [
            "Roll Number",
            "Student Name",
            "Email",
            ...sessions.map(s => s.createdAt.toISOString().split('T')[0]),
            "Total Attended",
            "Total Classes",
            "Percentage"
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(csvRows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`${year}_${subject}_Attendance_Report.csv`);
        return res.send(csv);
    } catch (error: any) {
        console.error("Export error:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
}