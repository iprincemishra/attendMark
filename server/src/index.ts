import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import prisma from './config/db.js';
import morgan from 'morgan';
import authRoute from './routes/auth.routes.js';
import studentRoute from './routes/student.routes.js';
import attendanceRoute from './routes/attendance.routes.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'))
app.use(express.json());


// * Routes
app.use("/api/auth", authRoute)
app.use("/api/students", studentRoute)
app.use("/api/attendance", attendanceRoute)


app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server is running 🚀",
        uptime: process.uptime(),
        date: new Date().toISOString()
    });
});

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected 🟢');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection 🔴', error);
        process.exit(1);
    }
};
startServer();