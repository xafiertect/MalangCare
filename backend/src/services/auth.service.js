// backend/src/services/auth.service.js
import prisma from '../config/database.js';
import redis from '../config/redis.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { encrypt } from '../utils/encryption.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';
import logger from '../utils/logger.js';

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // 587 uses TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Mengirimkan Email berisi Kode OTP.
 * Jika SMTP gagal, sistem akan melakukan fallback dengan mencatat OTP ke logs agar dev tetap berjalan lancar.
 */
async function sendOtpEmail(email, otpCode) {
  const mailOptions = {
    from: `"Lapor Malang" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verifikasi Akun Lapor Malang — Kode OTP',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">LAPOR MALANG</h2>
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar di <strong>Lapor Malang</strong>. Silakan gunakan kode OTP di bawah ini untuk menyelesaikan pendaftaran akun Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; background: #f3f4f6; padding: 10px 20px; border-radius: 6px; border: 1px dashed #0d9488;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #666; font-size: 14px;">*Kode OTP ini berlaku selama 10 menit. Mohon tidak membagikan kode ini kepada siapa pun.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">BRIDA Kabupaten Malang — Sistem Pengaduan Kerusakan Fasilitas Publik</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 Email OTP berhasil dikirim ke ${email}`);
  } catch (error) {
    logger.warn(`⚠️ Gagal mengirim email OTP ke ${email}. (FALLBACK) OTP Anda: [ ${otpCode} ]`);
  }
}

/**
 * Register User Baru
 */
export async function registerUser({ name, email, nik, phone, password }) {
  // 1. Cek duplikasi email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email sudah terdaftar.');
  }

  // 2. Enkripsi NIK & Hash password
  const nikEncrypted = encrypt(nik);
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Simpan data user ke database
  const user = await prisma.user.create({
    data: {
      name,
      email,
      nik_encrypted: nikEncrypted,
      phone,
      password_hash: passwordHash,
      is_verified: false
    }
  });

  // 4. Generate 6 digit OTP token
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  await prisma.otpToken.create({
    data: {
      user_id: user.id,
      token: otpCode,
      type: 'VERIFY_ACCOUNT',
      expires_at: expiresAt
    }
  });

  // 5. Kirim OTP via email
  await sendOtpEmail(email, otpCode);

  return { userId: user.id, email: user.email };
}

/**
 * Verifikasi Kode OTP
 */
export async function verifyUserOtp({ userId, token }) {
  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      user_id: userId,
      token,
      type: 'VERIFY_ACCOUNT',
      is_used: false
    }
  });

  if (!otpRecord) {
    throw new Error('Kode OTP tidak cocok atau sudah digunakan.');
  }

  if (new Date() > otpRecord.expires_at) {
    throw new Error('Kode OTP sudah kedaluwarsa.');
  }

  // Set OTP dan User terverifikasi dalam satu transaksi database
  await prisma.$transaction([
    prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { is_used: true }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { is_verified: true, is_active: true }
    })
  ]);

  return { success: true };
}

/**
 * Login Warga & Admin
 */
export async function loginUserOrAdmin({ email, password }) {
  // 1. Cek di tabel User terlebih dahulu
  let account = await prisma.user.findUnique({ where: { email } });
  let isUser = true;

  if (!account) {
    // 2. Jika tidak ada, cek di tabel Admin
    account = await prisma.admin.findUnique({ where: { email } });
    isUser = false;
  }

  if (!account) {
    throw new Error('Email atau password salah.');
  }

  // 3. Cek apakah terkunci (khusus User warga)
  if (isUser && account.locked_until && new Date() < account.locked_until) {
    const diff = Math.ceil((account.locked_until - new Date()) / (60 * 1000));
    throw new Error(`Akun Anda terkunci karena terlalu banyak percobaan masuk. Silakan coba kembali dalam ${diff} menit.`);
  }

  if (!account.is_active) {
    throw new Error('Akun Anda dinonaktifkan.');
  }

  if (isUser && !account.is_verified) {
    throw new Error('Akun Anda belum diverifikasi. Silakan masukkan kode OTP Anda.');
  }

  // 4. Bandingkan password hash
  const isMatch = await bcrypt.compare(password, account.password_hash);

  if (!isMatch) {
    if (isUser) {
      // Tingkatkan attempts login gagal
      const newAttempts = account.login_attempts + 1;
      let updateData = { login_attempts: newAttempts };
      
      if (newAttempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000); // Kunci 30 menit
        updateData.login_attempts = 0;
      }
      
      await prisma.user.update({ where: { id: account.id }, data: updateData });
    }
    throw new Error('Email atau password salah.');
  }

  // Login sukses -> reset attempts khusus user warga
  if (isUser) {
    await prisma.user.update({
      where: { id: account.id },
      data: { login_attempts: 0, locked_until: null }
    });
  } else {
    // Catat waktu login admin
    await prisma.admin.update({
      where: { id: account.id },
      data: { last_login_at: new Date() }
    });
  }

  // 5. Generate token akses & refresh
  const accessToken = generateAccessToken(account);
  const refreshToken = generateRefreshToken(account);

  // 6. Simpan Refresh Token ke Redis (Validasi single-use rotation)
  await redis.set(`refresh_token:${account.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      avatar_url: isUser ? account.avatar_url : null,
      unit_dinas: !isUser ? account.unit_dinas : null
    }
  };
}

/**
 * Single-use Refresh Token Rotation (RTR)
 */
export async function rotateSessionToken(oldRefreshToken) {
  try {
    const decoded = verifyRefreshToken(oldRefreshToken);
    
    // Validasi keberadaan refresh token di Redis
    const tokenKey = `refresh_token:${decoded.id}:${oldRefreshToken}`;
    const tokenState = await redis.get(tokenKey);

    if (!tokenState) {
      // Re-use detected! Blacklist semua session demi keamanan
      const keys = await redis.keys(`refresh_token:${decoded.id}:*`);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      throw new Error('Upaya re-use terdeteksi. Silakan login kembali.');
    }

    // Ambil data user/admin dari database
    let account = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!account) {
      account = await prisma.admin.findUnique({ where: { id: decoded.id } });
    }

    if (!account || !account.is_active) {
      throw new Error('Akun dinonaktifkan.');
    }

    // Hapus refresh token lama
    await redis.del(tokenKey);

    // Buat token baru
    const newAccessToken = generateAccessToken(account);
    const newRefreshToken = generateRefreshToken(account);

    // Simpan refresh token baru ke Redis
    await redis.set(`refresh_token:${account.id}:${newRefreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Sesi kedaluwarsa. Silakan login kembali.');
  }
}

/**
 * Logout & Blacklist JWT Token
 */
export async function logoutSession(token, refreshToken, userId) {
  await redis.del(`refresh_token:${userId}:${refreshToken}`);
  await redis.set(`blacklist:${token}`, 'logged_out', 'EX', 15 * 60);
  return { success: true };
}

/**
 * Kirim Ulang OTP untuk Verifikasi Akun
 */
export async function resendOtp({ userId }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User tidak ditemukan.');
  if (user.is_verified) throw new Error('Akun sudah terverifikasi.');

  // Invalidate OTP lama
  await prisma.otpToken.updateMany({
    where: { user_id: userId, type: 'VERIFY_ACCOUNT', is_used: false },
    data: { is_used: true }
  });

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpToken.create({
    data: { user_id: userId, token: otpCode, type: 'VERIFY_ACCOUNT', expires_at: expiresAt }
  });

  await sendOtpEmail(user.email, otpCode);
  return { success: true };
}

/**
 * Kirim Link Reset Password ke Email
 */
export async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Selalu kembalikan pesan sama agar tidak bocor apakah email terdaftar
  if (!user || !user.is_active) {
    return { success: true };
  }

  // Invalidate token reset lama
  await prisma.otpToken.updateMany({
    where: { user_id: user.id, type: 'RESET_PASSWORD', is_used: false },
    data: { is_used: true }
  });

  // Token 48-char hex (24 bytes) lebih aman dari OTP 6 digit
  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

  await prisma.otpToken.create({
    data: { user_id: user.id, token: resetToken, type: 'RESET_PASSWORD', expires_at: expiresAt }
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Lapor Malang" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Password Akun Lapor Malang',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #0d9488; text-align: center;">LAPOR MALANG</h2>
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">*Link ini berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">BRIDA Kabupaten Malang — Sistem Pengaduan Kerusakan Fasilitas Publik</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    logger.warn(`⚠️ Gagal kirim email reset password ke ${email}. Link: ${resetLink}`);
  }

  return { success: true };
}

/**
 * Reset Password dengan Token dari Link Email
 */
export async function resetPassword({ token, newPassword }) {
  const tokenRecord = await prisma.otpToken.findFirst({
    where: { token, type: 'RESET_PASSWORD', is_used: false },
    include: { user: true }
  });

  if (!tokenRecord) throw new Error('Token reset tidak valid atau sudah digunakan.');
  if (new Date() > tokenRecord.expires_at) throw new Error('Token reset sudah kedaluwarsa. Silakan minta link baru.');

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.user_id },
      data: { password_hash: passwordHash, login_attempts: 0, locked_until: null }
    }),
    prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { is_used: true }
    })
  ]);

  return { success: true };
}
