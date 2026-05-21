// backend/src/validators/auth.validator.js
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama lengkap wajib diisi minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    nik: z.string().length(16, 'NIK wajib terdiri dari 16 digit'),
    phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
    password: z.string().min(8, 'Password wajib minimal 8 karakter'),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword']
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    userId: z.string().uuid('User ID tidak valid'),
    token: z.string().length(6, 'Kode OTP wajib terdiri dari 6 digit')
  })
});
