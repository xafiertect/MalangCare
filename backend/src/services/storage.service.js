// backend/src/services/storage.service.js
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client, { bucketName } from '../config/minio.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Mengunggah berkas buffer ke MinIO bucket.
 * Mengembalikan URL publik berkas terunggah.
 */
export async function uploadToStorage(file, folder = 'public') {
  // Ambil ekstensi berkas asli
  const ext = file.originalname.split('.').pop();
  const fileUuid = crypto.randomUUID();
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}-${fileUuid}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);

    const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    return `${publicUrl}/${bucketName}/${fileName}`;
  } catch (error) {
    logger.error('❌ Gagal mengunggah berkas ke MinIO storage:', error);
    throw new Error('Gagal menyimpan file gambar ke storage system.');
  }
}

/**
 * Menghapus berkas dari MinIO bucket berdasarkan URL publik.
 */
export async function deleteFromStorage(fileUrl) {
  try {
    const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    const relativePath = fileUrl.replace(`${publicUrl}/${bucketName}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: relativePath
    });

    await s3Client.send(command);
    logger.info(`🗑️ Berhasil menghapus berkas dari S3: ${relativePath}`);
  } catch (error) {
    logger.error('❌ Gagal menghapus berkas dari MinIO storage:', error);
  }
}
