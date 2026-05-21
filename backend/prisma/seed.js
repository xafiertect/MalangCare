// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hashing password dengan 12 salt rounds sesuai aturan keamanan
  const superAdminPass = await bcrypt.hash('SuperAdmin@2026!', 12);
  
  await prisma.admin.upsert({
    where: { email: 'superadmin@lapormalang.id' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'superadmin@lapormalang.id',
      password_hash: superAdminPass,
      role: 'super_admin',
      unit_dinas: 'BRIDA Kabupaten Malang',
      is_active: true
    }
  });

  console.log('✅ Seeding selesai: Super Admin berhasil dibuat.');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
