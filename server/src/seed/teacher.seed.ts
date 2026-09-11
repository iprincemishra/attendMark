import 'dotenv/config';
import { prisma } from '../config/db';
import bcrypt from 'bcrypt';

const seedTeacher = async () => {
    try {
        const teacherEmail = process.env.TEACHER_EMAIL;
        const plainPassword = process.env.TEACHER_PASSWORD;
        const teacherName = process.env.TEACHER_NAME

        if (!teacherEmail || !plainPassword || !teacherName) {
            throw new Error('Missing TEACHER_EMAIL or TEACHER_PASSWORD in .env');
        }

        const existingTeacher = await prisma.user.findUnique({
            where: { email: teacherEmail },
        });

        if (existingTeacher) {
            console.log('Teacher already seeded:', existingTeacher.email);
            return;
        }

        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const teacher = await prisma.user.create({
            data: {
                name: teacherName,
                email: teacherEmail.toLowerCase(),
                role: 'TEACHER',
                passwordHash,
            },
        });

        console.log('Default Teacher created successfully:');
        console.log(`Email: ${teacher.email}`);

    } catch (e: any) {
        console.error('Error seeding teacher:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

seedTeacher();