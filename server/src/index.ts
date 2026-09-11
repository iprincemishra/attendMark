import dotenv from 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import prisma from './config/db';

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'Server is running',
        database: 'connected'
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