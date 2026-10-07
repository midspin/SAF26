const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'storage' AND table_name = 'objects'
    `);
    console.log('storage.objects columns:', cols);
  } catch (e) {
    console.error('Query error:', e);
  }
}

main().finally(() => prisma.$disconnect());
