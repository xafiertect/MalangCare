// backend/src/validators/admin.validator.js
import { z } from 'zod';

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    role: z.enum(['admin', 'super_admin'], {
      errorMap: () => ({ message: 'Role harus admin atau super_admin' })
    }),
    unit_dinas: z.string().min(3, 'Nama unit dinas minimal 3 karakter').optional()
  })
});

export const addAdminNoteSchema = z.object({
  body: z.object({
    note: z.string().min(5, 'Catatan minimal 5 karakter').max(1000, 'Catatan maksimal 1000 karakter')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token reset wajib disertakan'),
    newPassword: z.string().min(8, 'Password baru minimal 8 karakter')
  })
});

export const resendOtpSchema = z.object({
  body: z.object({
    userId: z.string().uuid('User ID tidak valid')
  })
});
