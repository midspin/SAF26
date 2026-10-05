const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany();
  console.log('Found events:', events.map(e => ({ id: e.id, name: e.name, code: e.code })));

  const deleted = await prisma.event.deleteMany({});
  console.log('Deleted events count:', deleted.count);

  const inventoryCount = await prisma.inventoryItem.count();
  console.log('Inventory items remaining in database:', inventoryCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
