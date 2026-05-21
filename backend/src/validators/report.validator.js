// backend/src/validators/report.validator.js
import { z } from 'zod';

export const createReportSchema = z.object({
  body: z.object({
    category: z.enum(['JALAN', 'JEMBATAN', 'DRAINASE', 'LAMPU_JALAN', 'TAMAN', 'FASILITAS_OLAHRAGA', 'LAINNYA'], {
      errorMap: () => ({ message: 'Kategori fasilitas tidak valid' })
    }),
    damage_level: z.enum(['RINGAN', 'SEDANG', 'BERAT'], {
      errorMap: () => ({ message: 'Tingkat kerusakan tidak valid' })
    }),
    description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
    latitude: z.coerce.number().min(-9.0, 'Koordinat latitude berada di luar wilayah Kabupaten Malang').max(-7.0, 'Koordinat latitude berada di luar wilayah Kabupaten Malang'),
    longitude: z.coerce.number().min(112.0, 'Koordinat longitude berada di luar wilayah Kabupaten Malang').max(113.5, 'Koordinat longitude berada di luar wilayah Kabupaten Malang'),
    address: z.string().min(5, 'Alamat lengkap wajib diisi minimal 5 karakter'),
    district: z.string().min(3, 'Nama kecamatan wajib diisi')
  })
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status tidak valid' })
    }),
    note: z.string().max(200, 'Catatan maksimal 200 karakter').optional(),
    rejection_reason: z.string().min(20, 'Alasan penolakan minimal 20 karakter').max(300).optional()
  })
});

export const reportRatingSchema = z.object({
  body: z.object({
    score: z.coerce.number().int().min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
    comment: z.string().max(200, 'Komentar maksimal 200 karakter').optional()
  })
});
