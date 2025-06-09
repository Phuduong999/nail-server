const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTurso() {
  try {
    console.log('🚀 Starting Turso setup...');

    // Push schema to Turso
    console.log('📦 Pushing schema to Turso...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // Seed data
    console.log('🌱 Seeding data...');
    execSync('npx prisma db seed', { stdio: 'inherit' });

    console.log('✅ Setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTurso(); 