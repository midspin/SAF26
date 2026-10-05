const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const events = await prisma.event.findMany();
  console.log('Events in DB:', events);

  const inventory = await prisma.inventoryItem.findMany({ take: 5 });
  console.log('Inventory sample count:', inventory.length);

  const eventCount = await prisma.event.count();
  const invCount = await prisma.inventoryItem.count();
  console.log(`TOTAL EVENTS: ${eventCount}, TOTAL INVENTORY ITEMS: ${invCount}`);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
