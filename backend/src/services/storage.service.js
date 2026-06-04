// backend/src/services/storage.service.js
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client, { bucketName } from '../config/minio.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../../uploads');

function saveLocally(file, folder) {
  const ext = file.originalname.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const fullPath = path.join(LOCAL_UPLOAD_DIR, fileName);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.buffer);
  const backendUrl = `http://localhost:${process.env.PORT || 5000}`;
  return `${backendUrl}/uploads/${fileName}`;
}

/**
 * Upload berkas ke MinIO. Jika MinIO tidak tersedia dan NODE_ENV !== production,
 * fallback ke penyimpanan lokal di folder uploads/.
 */
export async function uploadToStorage(file, folder = 'public') {
  const ext = file.originalname.split('.').pop();
  const fileUuid = crypto.randomUUID();
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}-${fileUuid}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(command);
    const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    return `${publicUrl}/${bucketName}/${fileName}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ Gagal upload ke MinIO (production):', error.message);
      throw new Error('Gagal menyimpan file gambar ke storage system.');
    }
    logger.warn(`⚠️ MinIO tidak tersedia, fallback ke local storage: ${error.message}`);
    return saveLocally(file, folder);
  }
}

/**
 * Hapus berkas dari MinIO atau local storage.
 */
export async function deleteFromStorage(fileUrl) {
  // Local storage
  const backendUrl = `http://localhost:${process.env.PORT || 5000}/uploads/`;
  if (fileUrl.startsWith(backendUrl)) {
    const relativePath = fileUrl.replace(backendUrl, '');
    const fullPath = path.join(LOCAL_UPLOAD_DIR, relativePath);
    try { fs.unlinkSync(fullPath); } catch { /* file mungkin sudah tidak ada */ }
    return;
  }

  // MinIO
  try {
    const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    const relativePath = fileUrl.replace(`${publicUrl}/${bucketName}/`, '');
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: relativePath }));
    logger.info(`🗑️ Berhasil menghapus berkas dari storage: ${relativePath}`);
  } catch (error) {
    logger.warn('⚠️ Gagal menghapus berkas dari storage:', error.message);
  }
}
