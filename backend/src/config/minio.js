// backend/src/config/minio.js
import 'dotenv/config'; // pastikan .env terbaca sebelum S3Client dibuat
import { S3Client } from '@aws-sdk/client-s3';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = process.env.MINIO_PORT || '9000';
const useSSL = process.env.MINIO_USE_SSL === 'true';

// Konfigurasi S3 Client untuk MinIO
const s3Client = new S3Client({
  endpoint: `http${useSSL ? 's' : ''}://${minioEndpoint}:${minioPort}`,
  forcePathStyle: true, // Diwajibkan untuk MinIO local development
  region: 'us-east-1',  // MinIO tidak mewajibkan region spesifik
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin_lapor',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'miniosecret_lapor_pass'
  }
});

export const bucketName = process.env.MINIO_BUCKET_NAME || 'lapor-malang';
export default s3Client;
