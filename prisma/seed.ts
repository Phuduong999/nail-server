import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Xóa tất cả dữ liệu cũ
  await prisma.review.deleteMany();
  await prisma.nailArtist.deleteMany();
  await prisma.user.deleteMany();
  // Nếu có dữ liệu mẫu khác, thêm ở đây
  console.log('Dữ liệu mẫu đã được làm sạch!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 