import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nailfpt.com' },
    update: {},
    create: {
      email: 'admin@nailfpt.com',
      password: adminPassword,
      role: 'ADMIN'
    },
  });

  // Create nail artist
  const artistPassword = await bcrypt.hash('artist123', 10);
  const artist = await prisma.user.upsert({
    where: { email: 'artist@nailfpt.com' },
    update: {},
    create: {
      email: 'artist@nailfpt.com',
      password: artistPassword,
      role: 'NAIL_ARTIST'
    },
  });

  // Create nail artist profile
  const nailArtist = await prisma.nailArtist.upsert({
    where: { userId: artist.id },
    update: {},
    create: {
      userId: artist.id,
      name: 'Nail Artist',
      phone: '0987654321',
      address: '123 Nail Street',
      latitude: 10.762622,
      longitude: 106.660172,
      description: 'Professional nail artist with 5 years of experience',
      status: 'ACTIVE'
    },
  });

  // Create customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@nailfpt.com' },
    update: {},
    create: {
      email: 'customer@nailfpt.com',
      password: customerPassword,
      role: 'CUSTOMER'
    },
  });

  console.log({ admin, artist, nailArtist, customer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 