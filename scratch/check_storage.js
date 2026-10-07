const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const buckets = await prisma.$queryRawUnsafe('SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets');
    console.log('Buckets:', buckets);
  } catch (e) {
    console.error('Query error:', e);
  }
}

main().finally(() => prisma.$disconnect());
