// backend/src/services/auth.service.js
import prisma from '../config/database.js';
import redis from '../config/redis.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { encrypt } from '../utils/encryption.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';
import logger from '../utils/logger.js';

const googleClient = new OAuth2Client();

const createError = (message, statusCode) =>
  Object.assign(new Error(message), { statusCode });

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
    return true;
  } catch (error) {
    logger.warn(`⚠️ Gagal mengirim email OTP ke ${email}. (FALLBACK) OTP: [ ${otpCode} ]`);
    return false;
  }
}

/**
 * Register User Baru
 */
export async function registerUser({ name, email, password }) {
  // 1. Cek duplikasi email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw createError('Email sudah terdaftar.', 409);
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Simpan data user ke database (langsung verified untuk MVP)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password_hash: passwordHash,
      is_verified: true,
      is_active: true
    }
  });

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
    throw createError('Kode OTP tidak cocok atau sudah digunakan.', 400);
  }

  if (new Date() > otpRecord.expires_at) {
    throw createError('Kode OTP sudah kedaluwarsa.', 400);
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
    throw createError('Email atau password salah.', 401);
  }

  // 3. Cek apakah terkunci (khusus User warga)
  if (isUser && account.locked_until && new Date() < account.locked_until) {
    const diff = Math.ceil((account.locked_until - new Date()) / (60 * 1000));
    throw createError(`Akun Anda terkunci karena terlalu banyak percobaan masuk. Silakan coba kembali dalam ${diff} menit.`, 423);
  }

  if (!account.is_active) {
    throw createError('Akun Anda dinonaktifkan.', 403);
  }

  if (isUser && !account.is_verified) {
    throw createError('Akun Anda belum diverifikasi. Silakan masukkan kode OTP Anda.', 403);
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
    throw createError('Email atau password salah.', 401);
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
      throw createError('Upaya re-use terdeteksi. Silakan login kembali.', 401);
    }

    // Ambil data user/admin dari database
    let account = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!account) {
      account = await prisma.admin.findUnique({ where: { id: decoded.id } });
    }

    if (!account || !account.is_active) {
      throw createError('Akun dinonaktifkan.', 403);
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
    if (error.statusCode) throw error;
    throw createError('Sesi kedaluwarsa. Silakan login kembali.', 401);
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
  if (!user) throw createError('User tidak ditemukan.', 404);
  if (user.is_verified) throw createError('Akun sudah terverifikasi.', 400);

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

  const emailSent = await sendOtpEmail(user.email, otpCode);
  const devOtp = (!emailSent && process.env.NODE_ENV !== 'production') ? otpCode : undefined;
  return { success: true, devOtp };
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
 * Login / Register via Google OAuth
 */
export async function googleLogin(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw Object.assign(new Error('Google OAuth belum dikonfigurasi di server.'), { statusCode: 501 });
  }

  // Verifikasi ID token Google
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error('Token Google tidak valid atau kedaluwarsa.'), { statusCode: 401 });
  }

  const { sub: googleId, email, name, picture } = payload;

  // Cari user berdasarkan google_id
  let user = await prisma.user.findUnique({ where: { google_id: googleId } });

  if (!user) {
    // Coba cari berdasarkan email (akun sudah terdaftar manual)
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Tautkan google_id ke akun yang ada
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { google_id: googleId, avatar_url: existing.avatar_url || picture, is_verified: true }
      });
    } else {
      // Buat akun baru dari Google
      user = await prisma.user.create({
        data: {
          name,
          email,
          google_id: googleId,
          avatar_url: picture,
          password_hash: '',
          is_verified: true,
          is_active: true,
        }
      });
    }
  }

  if (!user.is_active) {
    throw Object.assign(new Error('Akun Anda dinonaktifkan.'), { statusCode: 403 });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await redis.set(`refresh_token:${user.id}:${refreshToken}`, 'active', 'EX', 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      unit_dinas: null,
    }
  };
}

/**
 * Reset Password dengan Token dari Link Email
 */
export async function resetPassword({ token, newPassword }) {
  const tokenRecord = await prisma.otpToken.findFirst({
    where: { token, type: 'RESET_PASSWORD', is_used: false },
    include: { user: true }
  });

  if (!tokenRecord) throw createError('Token reset tidak valid atau sudah digunakan.', 400);
  if (new Date() > tokenRecord.expires_at) throw createError('Token reset sudah kedaluwarsa. Silakan minta link baru.', 400);

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
