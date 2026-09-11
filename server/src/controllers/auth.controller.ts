import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { IApiResponse } from "../types/response.types";

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