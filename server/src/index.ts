import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import prisma from './config/db';
import morgan from 'morgan';
import authRoute from './routes/auth.routes';
import studentRoute from './routes/student.routes';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'))
app.use(express.json());


// * Routes
app.use("/api/auth", authRoute)
app.use("/api/students", studentRoute)





app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server is running smoothly 🚀",
        uptime: process.uptime(),
        date: new Date().toISOString()
    });
});

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected via Prisma & Driver Adapter');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
};
startServer();