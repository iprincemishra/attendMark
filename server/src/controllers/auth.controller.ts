import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";
import { IApiResponse } from "../types/response.types.js";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const teacherLogin = async (req: Request, res: Response<IApiResponse>) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email & password are required"
            });
        }
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials or unauthorized"
            });
        }

        if (!user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: "Password not set for this account"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or password"
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            message: "Teacher Login successfully",
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const studentLogin = async (req: Request, res: Response<IApiResponse>) => {
    try {
        const { email, rollNumber, deviceId } = req.body;

        if (!email || !rollNumber || !deviceId) {
            return res.status(400).json({
                success: false,
                message: "Roll number, email, and deviceId are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRoll = rollNumber.trim().toUpperCase();

        const student = await prisma.user.findFirst({
            where: {
                rollNumber: normalizedRoll,
                email: normalizedEmail,
                role: 'STUDENT'
            }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found with this roll number & email"
            });
        }

        if (student.deviceId) {
            if (student.deviceId !== deviceId) {
                return res.status(403).json({
                    success: false,
                    message: "Device mismatch! Your account is already bound to another phone. Contact admin if you changed your device."
                });
            }
        } else {
            try {
                await prisma.user.update({
                    where: { id: student.id },
                    data: { deviceId }
                });
            } catch (dbError: any) {
                if (dbError.code === 'P2002') {
                    return res.status(403).json({
                        success: false,
                        message: "This physical device is already registered to another student. You cannot share phones for attendance."
                    });
                }
                throw dbError;
            }
        }

        const token = jwt.sign(
            {
                userId: student.id,
                email: student.email,
                role: student.role
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Student login successful & device verified',
            token,
            data: {
                id: student.id,
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber,
                deviceId: deviceId
            }
        });

    } catch (error: any) {
        console.error("Student login error: ", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};