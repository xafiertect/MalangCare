// backend/src/services/admin/adminUser.service.js
import prisma from '../../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logAudit } from '../../middleware/auditLog.middleware.js';
import logger from '../../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

/**
 * Daftar semua admin (super admin only)
 */
export async function listAdmins() {
  return prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      unit_dinas: true,
      is_active: true,
      last_login_at: true,
      created_at: true
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Membuat akun admin baru (hanya super admin)
 */
export async function createAdmin({ name, email, password, role, unit_dinas }, createdById, ipAddress = '0.0.0.0') {
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) throw new Error('Email sudah terdaftar sebagai admin.');

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.create({
    data: { name, email, password_hash: passwordHash, role, unit_dinas, created_by: createdById },
    select: { id: true, name: true, email: true, role: true, unit_dinas: true, created_at: true }
  });

  await logAudit({
    adminId: createdById,
    action: 'CREATE_ADMIN',
    targetId: admin.id,
    targetType: 'ADMIN',
    newValue: { name, email, role },
    ipAddress
  });

  // Kirim email notifikasi ke admin baru
  const mailOptions = {
    from: `"Lapor Malang" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Akun Admin Lapor Malang Telah Dibuat',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0d9488;">LAPOR MALANG — Akun Admin</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Akun admin Anda telah dibuat. Detail login:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Role:</strong> ${role}</li>
        </ul>
        <p>Segera login dan ganti password Anda di: <a href="${process.env.FRONTEND_URL}/admin/login">${process.env.FRONTEND_URL}/admin/login</a></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.warn(`⚠️ Gagal kirim email ke admin baru ${email}`);
  }

  return admin;
}

/**
 * Aktifkan/Nonaktifkan akun admin
 */
export async function toggleAdminStatus(targetAdminId, isActive, superAdminId, ipAddress = '0.0.0.0') {
  const admin = await prisma.admin.findUnique({ where: { id: targetAdminId } });
  if (!admin) throw new Error('Admin tidak ditemukan.');

  const updated = await prisma.admin.update({
    where: { id: targetAdminId },
    data: { is_active: isActive },
    select: { id: true, name: true, email: true, is_active: true }
  });

  await logAudit({
    adminId: superAdminId,
    action: 'DEACTIVATE_ADMIN',
    targetId: targetAdminId,
    targetType: 'ADMIN',
    oldValue: { is_active: admin.is_active },
    newValue: { is_active: isActive },
    ipAddress
  });

  return updated;
}

/**
 * Kirim link reset password ke admin tertentu
 */
export async function resetAdminPasswordByEmail(targetAdminId, superAdminId) {
  const admin = await prisma.admin.findUnique({ where: { id: targetAdminId } });
  if (!admin) throw new Error('Admin tidak ditemukan.');

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.admin.update({
    where: { id: targetAdminId },
    data: { password_hash: passwordHash }
  });

  const mailOptions = {
    from: `"Lapor Malang" <${process.env.SMTP_USER}>`,
    to: admin.email,
    subject: 'Reset Password Akun Admin Lapor Malang',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0d9488;">Reset Password Admin</h2>
        <p>Halo <strong>${admin.name}</strong>,</p>
        <p>Password Anda telah direset. Gunakan password sementara berikut untuk login:</p>
        <div style="text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 12px; border-radius: 6px;">
          ${tempPassword}
        </div>
        <p>Segera ganti password Anda setelah login.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.warn(`⚠️ Gagal kirim email reset password ke admin ${admin.email}. Password sementara: ${tempPassword}`);
  }

  return { success: true };
}
