// backend/src/middleware/upload.middleware.js
import multer from 'multer';

// Konfigurasi storage di memori (memory storage)
const storage = multer.memoryStorage();

// Filter tipe file gambar
const fileFilter = (req, file, cb) => {
  const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipe file tidak didukung. Wajib berformat JPG, PNG, atau WEBP.'), false);
  }
};

// Batasan ukuran maksimum (5MB per file)
const limits = {
  fileSize: 5 * 1024 * 1024 // 5 Megabytes
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits
}).array('photos', 5); // Maksimal 5 file foto

// Single upload untuk bukti perbaikan admin (field: 'evidence')
export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits
}).single('evidence');

// Single upload untuk avatar user (field: 'avatar')
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB untuk avatar
}).single('avatar');
