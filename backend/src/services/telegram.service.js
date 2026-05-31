// backend/src/services/telegram.service.js
import prisma from '../config/database.js';
import redis from '../config/redis.js';
import { createReport } from './report.service.js';
import config from '../config/telegram.js';
import logger from '../utils/logger.js';

let isPolling = false;
let offset = 0;

/**
 * Normalisasi nomor HP untuk keperluan pencocokan user
 */
function getPhoneVariants(phone) {
  const clean = phone.replace(/\D/g, '');
  const variants = [clean, `+${clean}`];
  if (clean.startsWith('62')) {
    variants.push('0' + clean.substring(2));
  } else if (clean.startsWith('0')) {
    variants.push('62' + clean.substring(1));
    variants.push('+62' + clean.substring(1));
  }
  return variants;
}

/**
 * Helper untuk mengirim HTTP POST ke Telegram Bot API
 */
export async function sendTelegramAPI(method, body) {
  if (!config.token) {
    logger.warn('⚠️ Telegram Bot Token tidak terkonfigurasi.');
    return null;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.token}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      logger.error(`❌ Gagal memanggil metode Telegram ${method}:`, data);
      return null;
    }
    return data.result;
  } catch (error) {
    logger.error(`❌ Kesalahan koneksi ke Telegram API (${method}):`, error);
    return null;
  }
}

/**
 * Mengirim pesan teks ke chat tertentu
 */
export async function sendMessage(chatId, text, options = {}) {
  return sendTelegramAPI('sendMessage', {
    chat_id: chatId,
    text,
    ...options
  });
}

/**
 * Mengirim notifikasi perubahan status laporan
 */
export async function sendStatusNotification(telegramId, title, message, reportNumber) {
  const text = `🔔 *${title}*\n\nNomor Laporan: \`${reportNumber}\`\n\n${message}`;
  return sendMessage(telegramId, text, { parse_mode: 'Markdown' });
}

/**
 * Menguji apakah koordinat GPS berada di wilayah Kabupaten Malang
 */
function isWithinMalang(lat, lng) {
  // Koordinat Kabupaten Malang berkisar sekitar:
  // Lat: -8.6 s/d -7.5
  // Lng: 112.1 s/d 113.1
  return lat >= -8.6 && lat <= -7.5 && lng >= 112.1 && lng <= 113.1;
}

/**
 * Reverse Geocoding menggunakan Nominatim OpenStreetMap API
 */
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'User-Agent': 'MalangCareBot/1.0'
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('❌ Gagal reverse geocode koordinat:', error);
    return null;
  }
}

/**
 * Inisialisasi Bot Telegram Polling Loop
 */
export async function initTelegramBot() {
  if (!config.isActive) {
    logger.info('🔌 Integrasi Telegram Bot dinonaktifkan.');
    return;
  }
  if (!config.token) {
    logger.error('❌ Token Telegram Bot kosong. Gagal memulai bot.');
    return;
  }

  logger.info('🤖 Memulai polling bot Telegram...');
  isPolling = true;
  pollUpdates();
}

/**
 * Fungsi rekursif long-polling untuk menerima updates
 */
async function pollUpdates() {
  while (isPolling) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${config.token}/getUpdates?offset=${offset}&timeout=30`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (error) {
      logger.error('❌ Kesalahan polling bot Telegram:', error.message);
      // Tunggu 5 detik sebelum coba lagi jika error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Hentikan Polling Bot Telegram
 */
export function stopTelegramBot() {
  isPolling = false;
  logger.info('🛑 Polling bot Telegram dihentikan.');
}

/**
 * Menangani Update dari Telegram
 */
async function handleUpdate(update) {
  // Hanya proses update berupa pesan teks, kontak, lokasi, atau foto
  const message = update.message;
  if (!message) return;

  const chatId = String(message.chat.id);
  const text = message.text?.trim();

  // 1. Tangani perintah pembatalan global
  if (text === '/cancel') {
    await redis.del(`tg:state:${chatId}`);
    return sendMessage(chatId, '❌ Pembuatan laporan dibatalkan.', {
      reply_markup: { remove_keyboard: true }
    });
  }

  // 2. Periksa apakah user sudah tertaut
  const user = await prisma.user.findFirst({
    where: { telegram_id: chatId }
  });

  // 3. Jika belum tertaut, wajib share contact
  if (!user) {
    return handleUnlinkedUser(chatId, message);
  }

  // 4. Proses perintah global
  if (text === '/start') {
    return sendMessage(chatId, `👋 Halo, *${user.name}*! Selamat datang kembali di *MALANGCARE Bot*.\n\nLaporkan kerusakan fasilitas publik langsung dari sini tanpa perlu buka website.\n\n📋 Perintah tersedia:\n/lapor - Buat laporan kerusakan baru\n/status - Pantau status laporan Anda\n/help - Panduan penggunaan`, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }

  if (text === '/help') {
    return sendMessage(chatId, `💡 *Panduan Bot LAPOR MALANG*\n\n1. Ketik /lapor untuk melaporkan kerusakan fasilitas umum.\n2. Ikuti instruksi bot untuk mengirimkan:\n   - Foto kerusakan\n   - Lokasi kejadian (GPS)\n   - Kategori fasilitas\n   - Tingkat kerusakan\n   - Deskripsi tambahan\n3. Ketik /cancel kapan saja untuk membatalkan proses.\n4. Ketik /status untuk melihat laporan terbaru Anda.`, {
      parse_mode: 'Markdown'
    });
  }

  if (text === '/status') {
    return handleCheckStatus(chatId, user.id);
  }

  if (text === '/lapor') {
    // Inisialisasi state pelaporan baru
    const state = { step: 'WAITING_FOR_PHOTO', photos: [] };
    await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);
    return sendMessage(chatId, '📸 Silakan kirimkan *1 foto* kerusakan fasilitas publik terlebih dahulu:', {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }

  // 5. Tangani state pelaporan (State Machine)
  const stateRaw = await redis.get(`tg:state:${chatId}`);
  if (!stateRaw) {
    return sendMessage(chatId, 'Gunakan perintah /lapor untuk membuat laporan baru, atau /help untuk bantuan.');
  }

  const state = JSON.parse(stateRaw);
  await handleReportWorkflow(chatId, user.id, state, message);
}

/**
 * Alur penautan akun via share contact
 */
async function handleUnlinkedUser(chatId, message) {
  // Jika mengirimkan kontak
  if (message.contact) {
    const contact = message.contact;
    const senderId = String(message.from.id);
    
    // Keamanan: pastikan user membagikan kontak miliknya sendiri
    if (String(contact.user_id) !== senderId) {
      return sendMessage(chatId, '⚠️ Silakan bagikan nomor kontak Anda sendiri menggunakan tombol yang disediakan.', {
        reply_markup: {
          keyboard: [[{ text: '📱 Bagikan Kontak Saya', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }

    const phoneVariants = getPhoneVariants(contact.phone_number);

    // Cari user di database berdasarkan nomor HP
    let matchUser = await prisma.user.findFirst({
      where: { phone: { in: phoneVariants } }
    });

    if (!matchUser) {
      // Cek apakah telegram_id sudah pernah dibuat akun sebelumnya
      matchUser = await prisma.user.findUnique({ where: { telegram_id: chatId } });
    }

    if (!matchUser) {
      // Buat akun baru otomatis dari data Telegram — tidak perlu daftar dulu
      const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Pengguna Telegram';
      const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;

      // Email placeholder unik agar tidak konflik dengan unique constraint
      const placeholderEmail = `tg_${chatId}@lapormalang.id`;

      matchUser = await prisma.user.create({
        data: {
          name,
          email: placeholderEmail,
          phone,
          password_hash: '',       // tidak bisa login via website (hanya via Telegram)
          telegram_id: chatId,
          is_verified: true,
          is_active: true,
        }
      });

      return sendMessage(chatId, `🎉 Akun berhasil dibuat!\n\nSelamat datang, *${matchUser.name}*!\nAkun Anda telah terdaftar otomatis melalui Telegram.\n\nGunakan perintah berikut:\n/lapor - Membuat laporan kerusakan baru\n/status - Melihat status laporan Anda\n/help - Bantuan`, {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      });
    }

    // Akun sudah ada — tautkan telegram_id jika belum
    if (matchUser.telegram_id !== chatId) {
      await prisma.user.update({
        where: { id: matchUser.id },
        data: { telegram_id: chatId }
      });
    }

    return sendMessage(chatId, `✅ Akun berhasil ditautkan!\n\nSelamat datang kembali, *${matchUser.name}*.\nGunakan perintah berikut:\n/lapor - Membuat laporan kerusakan baru\n/status - Melihat status laporan Anda\n/help - Bantuan`, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }

  // Jika bukan kontak, minta share kontak
  return sendMessage(chatId, '👋 Selamat datang di *MALANGCARE Bot*!\n\nTekan tombol di bawah untuk mulai. Tidak perlu daftar terlebih dahulu — akun akan dibuat otomatis dari nomor Telegram Anda.', {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{ text: '📱 Bagikan Kontak & Mulai', request_contact: true }]],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
}

/**
 * State Machine Laporan Kerusakan
 */
async function handleReportWorkflow(chatId, userId, state, message) {
  const step = state.step;

  switch (step) {
    case 'WAITING_FOR_PHOTO': {
      if (!message.photo) {
        return sendMessage(chatId, '⚠️ Mohon kirimkan gambar/foto kerusakan fasilitas publik.');
      }
      
      sendMessage(chatId, '⏳ Mengunduh foto laporan Anda...');

      // Ambil ukuran foto terbesar
      const photo = message.photo[message.photo.length - 1];
      const fileId = photo.file_id;

      // Ambil file path dari Telegram API
      const fileInfo = await sendTelegramAPI('getFile', { file_id: fileId });
      if (!fileInfo) {
        return sendMessage(chatId, '❌ Gagal mengunduh foto dari Telegram. Silakan coba kirim ulang foto Anda.');
      }

      try {
        const fileUrl = `https://api.telegram.org/file/bot${config.token}/${fileInfo.file_path}`;
        const imgResponse = await fetch(fileUrl);
        if (!imgResponse.ok) throw new Error('Download failed');
        const buffer = await imgResponse.arrayBuffer();
        const base64Photo = Buffer.from(buffer).toString('base64');

        state.photos = [{
          base64: base64Photo,
          originalname: `tg_report_${Date.now()}.jpg`,
          mimetype: 'image/jpeg'
        }];

        state.step = 'WAITING_FOR_LOCATION';
        await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);

        return sendMessage(chatId, '✅ Foto berhasil diterima!\n\n📍 Sekarang, mohon kirimkan koordinat lokasi kejadian menggunakan fitur *Kirim Lokasi* (GPS Share) di Telegram Anda:', {
          parse_mode: 'Markdown',
          reply_markup: { remove_keyboard: true }
        });
      } catch (err) {
        logger.error('❌ Gagal mengunduh foto:', err);
        return sendMessage(chatId, '❌ Terjadi kesalahan saat memproses gambar. Silakan kirim ulang foto.');
      }
    }

    case 'WAITING_FOR_LOCATION': {
      if (!message.location) {
        return sendMessage(chatId, '⚠️ Mohon bagikan lokasi GPS kejadian menggunakan fitur lokasi Telegram.');
      }

      const { latitude, longitude } = message.location;

      // Validasi wilayah Kabupaten Malang
      if (!isWithinMalang(latitude, longitude)) {
        return sendMessage(chatId, '❌ Lokasi koordinat terdeteksi berada di luar wilayah Kabupaten Malang. Silakan kirimkan titik lokasi yang valid di dalam Kabupaten Malang.');
      }

      sendMessage(chatId, '⏳ Mendeteksi alamat detail lokasi...');

      // Reverse geocoding
      const geoData = await reverseGeocode(latitude, longitude);
      const address = geoData?.display_name || `Koordinat (${latitude}, ${longitude})`;
      const addressDetails = geoData?.address || {};
      const district = addressDetails.subdistrict || addressDetails.town || addressDetails.village || addressDetails.city_district || addressDetails.suburb || 'Malang';

      state.latitude = latitude;
      state.longitude = longitude;
      state.address = address;
      state.district = district;
      state.step = 'WAITING_FOR_CATEGORY';
      await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);

      // Present Kategori
      return sendMessage(chatId, `📍 Lokasi berhasil terdeteksi:\n*Kecamatan*: ${district}\n*Alamat*: ${address}\n\n🏷️ Pilih kategori fasilitas publik yang dilaporkan:`, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            ['🛣️ Jalan', '🌉 Jembatan'],
            ['🏞️ Drainase', '💡 Lampu Jalan'],
            ['🌳 Taman', '⚽ Fasilitas Olahraga'],
            ['📦 Lainnya']
          ],
          resize_keyboard: true
        }
      });
    }

    case 'WAITING_FOR_CATEGORY': {
      // Mapping fleksibel — cocokkan dengan atau tanpa emoji, trim, case-insensitive
      const categoryMap = {
        'jalan': 'JALAN',
        'jembatan': 'JEMBATAN',
        'drainase': 'DRAINASE',
        'lampu jalan': 'LAMPU_JALAN',
        'taman': 'TAMAN',
        'fasilitas olahraga': 'FASILITAS_OLAHRAGA',
        'lainnya': 'LAINNYA',
      };

      const rawText = (message.text || '').trim();
      // Hapus emoji (karakter non-ASCII di awal/akhir) lalu normalize
      const normalized = rawText.replace(/[^\w\s]/gu, '').trim().toLowerCase();

      const mappedCategory = categoryMap[normalized];

      if (!mappedCategory) {
        // Re-tampilkan keyboard agar user tidak stuck
        return sendMessage(chatId, '⚠️ Pilihan tidak dikenali. Silakan tekan salah satu tombol kategori di bawah ini:', {
          reply_markup: {
            keyboard: [
              ['🛣️ Jalan', '🌉 Jembatan'],
              ['🏞️ Drainase', '💡 Lampu Jalan'],
              ['🌳 Taman', '⚽ Fasilitas Olahraga'],
              ['📦 Lainnya']
            ],
            resize_keyboard: true
          }
        });
      }

      const labelMap = {
        'JALAN': 'Jalan', 'JEMBATAN': 'Jembatan', 'DRAINASE': 'Drainase',
        'LAMPU_JALAN': 'Lampu Jalan', 'TAMAN': 'Taman',
        'FASILITAS_OLAHRAGA': 'Fasilitas Olahraga', 'LAINNYA': 'Lainnya'
      };

      state.category = mappedCategory;
      state.step = 'WAITING_FOR_DAMAGE_LEVEL';
      await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);

      return sendMessage(chatId, `✅ Kategori: *${labelMap[mappedCategory]}*\n\n⚡ Sekarang pilih tingkat kerusakan:`, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            ['🟢 Ringan', '🟡 Sedang', '🔴 Berat']
          ],
          resize_keyboard: true
        }
      });
    }

    case 'WAITING_FOR_DAMAGE_LEVEL': {
      const levelMap = {
        'ringan': 'RINGAN',
        'sedang': 'SEDANG',
        'berat': 'BERAT',
      };

      const rawText = (message.text || '').trim();
      const normalized = rawText.replace(/[^\w\s]/gu, '').trim().toLowerCase();
      const mappedLevel = levelMap[normalized];

      if (!mappedLevel) {
        // Re-tampilkan keyboard agar user tidak stuck
        return sendMessage(chatId, '⚠️ Pilihan tidak dikenali. Silakan tekan salah satu tombol tingkat kerusakan:', {
          reply_markup: {
            keyboard: [
              ['🟢 Ringan', '🟡 Sedang', '🔴 Berat']
            ],
            resize_keyboard: true
          }
        });
      }

      const levelLabelMap = { 'RINGAN': 'Ringan', 'SEDANG': 'Sedang', 'BERAT': 'Berat' };

      state.damage_level = mappedLevel;
      state.step = 'WAITING_FOR_DESCRIPTION';
      await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);

      return sendMessage(chatId, `✅ Tingkat kerusakan: *${levelLabelMap[mappedLevel]}*\n\n📝 Tulis deskripsi singkat kerusakan (opsional — ketik /skip untuk lewati):`, {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      });
    }

    case 'WAITING_FOR_DESCRIPTION': {
      const descText = message.text;
      const description = descText === '/skip' ? '' : descText;

      if (description.length > 500) {
        return sendMessage(chatId, '⚠️ Deskripsi terlalu panjang. Maksimal 500 karakter. Tulis ulang deskripsi singkat Anda:');
      }

      state.description = description;
      state.step = 'WAITING_FOR_CONFIRMATION';
      await redis.set(`tg:state:${chatId}`, JSON.stringify(state), 'EX', 3600);

      // Tampilkan ringkasan
      const catLabel = {
        'JALAN': 'Jalan',
        'JEMBATAN': 'Jembatan',
        'DRAINASE': 'Drainase',
        'LAMPU_JALAN': 'Lampu Jalan',
        'TAMAN': 'Taman',
        'FASILITAS_OLAHRAGA': 'Fasilitas Olahraga',
        'LAINNYA': 'Lainnya'
      }[state.category];

      const levelLabel = {
        'RINGAN': 'Ringan',
        'SEDANG': 'Sedang',
        'BERAT': 'Berat'
      }[state.damage_level];

      const summary = `📝 *Ringkasan Laporan Kerusakan*\n\n` +
        `📂 *Kategori*: ${catLabel}\n` +
        `⚡ *Tingkat Kerusakan*: ${levelLabel}\n` +
        `📍 *Kecamatan*: ${state.district}\n` +
        `🏠 *Alamat*: ${state.address}\n` +
        `✏️ *Deskripsi*: ${description || '-'}\n\n` +
        `Apakah data di atas sudah benar? Pilih tombol di bawah untuk memproses:`;

      return sendMessage(chatId, summary, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            ['📤 Kirim Laporan', '❌ Batalkan']
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }

    case 'WAITING_FOR_CONFIRMATION': {
      const option = message.text;

      if (option === '❌ Batalkan') {
        await redis.del(`tg:state:${chatId}`);
        return sendMessage(chatId, '❌ Laporan dibatalkan.', {
          reply_markup: { remove_keyboard: true }
        });
      }

      if (option !== '📤 Kirim Laporan') {
        return sendMessage(chatId, '⚠️ Pilihan tidak valid. Silakan tekan tombol Kirim Laporan atau Batalkan.');
      }

      sendMessage(chatId, '⏳ Sedang mengirimkan laporan Anda ke sistem Lapor Malang...', {
        reply_markup: { remove_keyboard: true }
      });

      try {
        // Konversi base64 photo kembali ke Buffer
        const photoData = state.photos[0];
        const photoBuffer = Buffer.from(photoData.base64, 'base64');
        
        const files = [{
          originalname: photoData.originalname,
          mimetype: photoData.mimetype,
          buffer: photoBuffer,
          size: photoBuffer.length
        }];

        const reportData = {
          category: state.category,
          damage_level: state.damage_level,
          description: state.description,
          latitude: state.latitude,
          longitude: state.longitude,
          address: state.address,
          district: state.district
        };

        // Buat laporan melalui reportService
        const result = await createReport(userId, reportData, files);
        
        await redis.del(`tg:state:${chatId}`);

        return sendMessage(chatId, `🎉 *Laporan Berhasil Terkirim!*\n\nNomor Laporan Anda: \`${result.report.report_number}\`\n\nLaporan Anda saat ini sedang menunggu verifikasi oleh pihak admin terkait. Anda akan menerima notifikasi otomatis di Telegram ini saat status laporan Anda diperbarui. Terima kasih!`, {
          parse_mode: 'Markdown'
        });
      } catch (err) {
        logger.error('❌ Gagal membuat laporan via Telegram:', err);
        return sendMessage(chatId, `❌ Gagal menyimpan laporan: ${err.message}. Silakan coba buat kembali dengan /lapor.`);
      }
    }

    default:
      await redis.del(`tg:state:${chatId}`);
      return sendMessage(chatId, 'Terjadi kesalahan alur pelaporan. Silakan ulangi dengan perintah /lapor.');
  }
}

/**
 * Menangani pengecekan status laporan terbaru milik user
 */
async function handleCheckStatus(chatId, userId) {
  try {
    const reports = await prisma.report.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 3
    });

    if (reports.length === 0) {
      return sendMessage(chatId, 'Anda belum memiliki riwayat laporan kerusakan.');
    }

    let text = '📋 *3 Laporan Terbaru Anda:*\n\n';
    
    const statusIcons = {
      'PENDING': '⏳ MENUNGGU',
      'IN_PROGRESS': '⚙️ DIPROSES',
      'RESOLVED': '✅ SELESAI',
      'REJECTED': '❌ DITOLAK'
    };

    const categoryLabels = {
      'JALAN': 'Jalan',
      'JEMBATAN': 'Jembatan',
      'DRAINASE': 'Drainase',
      'LAMPU_JALAN': 'Lampu Jalan',
      'TAMAN': 'Taman',
      'FASILITAS_OLAHRAGA': 'Fasilitas Olahraga',
      'LAINNYA': 'Lainnya'
    };

    for (const r of reports) {
      text += `📄 *No. Laporan:* \`${r.report_number}\`\n`;
      text += `🏷️ *Fasilitas:* ${categoryLabels[r.category]}\n`;
      text += `📍 *Kecamatan:* ${r.district}\n`;
      text += `⚡ *Status:* ${statusIcons[r.status] || r.status}\n`;
      if (r.status === 'REJECTED' && r.rejection_reason) {
        text += `⚠️ *Alasan:* ${r.rejection_reason}\n`;
      }
      text += `📅 *Tanggal:* ${new Date(r.created_at).toLocaleDateString('id-ID')}\n\n`;
    }

    return sendMessage(chatId, text, { parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('❌ Gagal memeriksa status laporan di Telegram:', err);
    return sendMessage(chatId, '❌ Terjadi kesalahan saat memuat status laporan.');
  }
}
