// backend/src/config/database.js
import 'dotenv/config'; // pastikan DATABASE_URL terbaca sebelum PrismaClient dibuat
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' }
  ]
});

prisma.$on('query', (e) => {
  // Hanya log query di mode development agar console log tidak terlalu penuh
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Query: ${e.query} | Durasi: ${e.duration}ms`);
  }
});

export default prisma;
