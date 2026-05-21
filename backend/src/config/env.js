// backend/src/config/env.js
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32-byte key in hex format (64 chars)
  MINIO_BUCKET_NAME: z.string().default('lapor-malang'),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Kesalahan konfigurasi environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
