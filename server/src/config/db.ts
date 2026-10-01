import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 10,
});

export const prisma = new PrismaClient({ adapter });

export default prisma;