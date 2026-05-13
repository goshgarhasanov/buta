/**
 * Database seed — development üçün test məlumatları.
 *
 * Run: pnpm db:seed
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed başladı...');

  const passwordHash = await argon2.hash('Test1234!', { type: argon2.argon2id });

  // Admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@buta.az',
      passwordHash,
      displayName: 'Buta Admin',
      bio: 'Platforma administratoru',
      role: UserRole.ADMIN,
      verified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Sample creators
  const creators = [
    { username: 'aysel', displayName: 'Aysel Quliyeva', bio: 'Musiqi sevən' },
    { username: 'rashad', displayName: 'Rəşad Məmmədov', bio: 'Komediya' },
    { username: 'nigar', displayName: 'Nigar Hüseynova', bio: 'Yemək bloqu' },
  ];

  for (const c of creators) {
    await prisma.user.upsert({
      where: { username: c.username },
      update: {},
      create: {
        ...c,
        email: `${c.username}@buta.az`,
        passwordHash,
        role: UserRole.CREATOR,
        verified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  // Hashtags
  const tags = ['azerbaycan', 'musiqi', 'yemek', 'komediya', 'seyahet'];
  for (const name of tags) {
    await prisma.hashtag.upsert({
      where: { name },
      update: {},
      create: { name, trending: true },
    });
  }

  console.log(`✅ Admin yaradıldı: ${admin.username} / Test1234!`);
  console.log(`✅ ${creators.length} creator yaradıldı`);
  console.log(`✅ ${tags.length} hashtag yaradıldı`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
