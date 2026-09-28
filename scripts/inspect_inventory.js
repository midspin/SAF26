const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const events = await prisma.event.findMany();
  for (const ev of events) {
    const count = await prisma.inventoryItem.count({ where: { eventId: ev.id } });
    console.log(`Event "${ev.name}" (${ev.code}, Status: ${ev.status}): ${count} items`);
  }
  const total = await prisma.inventoryItem.count();
  console.log('Total Master Inventory items:', total);
  await prisma.$disconnect();
}

inspect();




