// backend/src/services/user.service.js
import prisma from '../config/database.js';
import { uploadToStorage } from './storage.service.js';

/**
 * Mendapatkan profil user berdasarkan ID
 */
export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar_url: true,
      role: true,
      is_verified: true,
      created_at: true,
      _count: {
        select: { reports: true }
      }
    }
  });

  if (!user) throw new Error('User tidak ditemukan.');
  return user;
}

/**
 * Mengupdate profil user (nama, nomor HP)
 */
export async function updateProfile(userId, { name, phone }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone })
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar_url: true,
      role: true
    }
  });
}

/**
 * Upload dan update foto profil (avatar)
 */
export async function uploadAvatar(userId, file) {
  if (!file) throw new Error('File avatar tidak ditemukan.');

  const avatarUrl = await uploadToStorage(file, 'avatars');

  return prisma.user.update({
    where: { id: userId },
    data: { avatar_url: avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true
    }
  });
}
