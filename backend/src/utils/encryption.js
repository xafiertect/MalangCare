// backend/src/utils/encryption.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Mengenkripsi teks sensitif (seperti NIK) menggunakan AES-256-GCM.
 * Format output: ivHex:authTagHex:encryptedTextHex
 */
export function encrypt(text) {
  if (!text) return null;
  
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY tidak valid. Wajib 64 karakter hex (32 bytes).');
  }
  
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Mendekripsi teks sensitif AES-256-GCM.
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY tidak valid. Wajib 64 karakter hex (32 bytes).');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Format teks terenkripsi tidak valid.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');
  const key = Buffer.from(keyHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
