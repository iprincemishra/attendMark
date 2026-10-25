import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import prisma from '../config/db.js';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { IApiResponse } from '../types/response.types.js';

// 1. Single Student Add 
export const addSingleStudent = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {

    try {

        const { name, email, rollNumber, year } = req.body;
        if (!name || !email || !rollNumber || !year) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, roll number, and year (e.g., BCA3) are required'
            });
        }

        const existingStudent = await prisma.user.findFirst({
            where: { OR: [{ email }, { rollNumber }] },
        });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email or roll number already exists'
            });
        }

        const student = await prisma.user.create({
            data: {
                name,
                email,
                rollNumber,
                year,
                role: 'STUDENT',
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Student added successfully',
            data: student,
        });

    } catch (error: any) {
        console.error('Add student error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// 2. CSV Bulk Upload 
export const uploadStudentsCsv = async (req: AuthenticatedRequest, res: Response<IApiResponse>) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a CSV file'
            });
        }

        const defaultYear = req.body.year

        const results: any[] = [];
        const bufferStream = Readable.from(req.file.buffer);

        bufferStream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Filter out rows with missing data
                    const validRows = results
                        .filter(r => r.name && r.email && r.rollNumber)
                        .map(r => ({
                            name: r.name.trim(),
                            email: r.email.trim().toLowerCase(),
                            rollNumber: r.rollNumber.trim().toUpperCase(),
                            year: (r.year || defaultYear || '').trim()
                        }));

                    if (validRows.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'CSV is empty or missing required columns'
                        });
                    }

                    const missingYear = validRows.find(r => !r.year);
                    if (missingYear) {
                        return res.status(400).json({
                            success: false,
                            message: 'Year (e.g., BCA3) is required for all students either in request body or CSV column'
                        });
                    }

                    // Extract all emails and roll numbers from the CSV
                    const emails = validRows.map(r => r.email);
                    const rollNumbers = validRows.map(r => r.rollNumber);

                    const existingUsers = await prisma.user.findMany({
                        where: {
                            OR: [
                                { email: { in: emails } },
                                { rollNumber: { in: rollNumbers } }
                            ]
                        },
                        select: { email: true, rollNumber: true }
                    });

                    // Create Sets for ultra-fast lookups
                    const existingEmails = new Set(existingUsers.map((u: any) => u.email));
                    const existingRolls = new Set(existingUsers.map((u: any) => u.rollNumber));

                    // Filter out students that already exist
                    const newStudents = validRows.filter(row =>
                        !existingEmails.has(row.email) && !existingRolls.has(row.rollNumber)
                    ).map(row => ({
                        name: row.name,
                        email: row.email,
                        rollNumber: row.rollNumber,
                        year: row.year,
                        role: 'STUDENT' as const
                    }));

                    if (newStudents.length > 0) {
                        await prisma.user.createMany({
                            data: newStudents,
                            skipDuplicates: true
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: `CSV processed successfully. Added: ${newStudents.length}, Skipped (already exists): ${validRows.length - newStudents.length}`,
                    });

                } catch (dbError: any) {
                    console.error('DB bulk insert error:', dbError.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving students to database',
                        error: dbError.message
                    });
                }
            });
    } catch (error: any) {
        console.error('CSV upload error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};