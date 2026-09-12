import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IApiResponse } from '../types/response.types';
import 'multer';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string
    };
    file?: Express.Multer.File;
}

export const verifyTeacher = (req: AuthenticatedRequest, res: Response<IApiResponse>, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {

        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            email: string;
            role: string
        };

        if (!['TEACHER', 'ADMIN'].includes(decoded.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Teacher access required'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};