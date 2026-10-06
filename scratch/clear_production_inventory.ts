import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing Production Table data...');

  // 1. Get IDs of all Production Inventory Items
  const prodItems = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { inventoryUsageType: 'PRODUCTION' },
        { inventoryCategory: { contains: 'PRODUCTION', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  const prodItemIds = prodItems.map((i) => i.id);

  if (prodItemIds.length > 0) {
    // Delete allocations for these items
    const deletedAllocs = await prisma.inventoryAllocation.deleteMany({
      where: { inventoryItemId: { in: prodItemIds } },
    });
    console.log(`Deleted ${deletedAllocs.count} production allocations.`);

    // Delete movements for these items
    const deletedMovements = await prisma.inventoryMovement.deleteMany({
      where: { inventoryItemId: { in: prodItemIds } },
    });
    console.log(`Deleted ${deletedMovements.count} production movements.`);

    // Delete inventory items
    const deletedItems = await prisma.inventoryItem.deleteMany({
      where: { id: { in: prodItemIds } },
    });
    console.log(`Deleted ${deletedItems.count} production inventory items.`);
  }

  // 2. Delete any Production Requirements
  const deletedReqs = await prisma.productionRequirement.deleteMany({});
  console.log(`Deleted ${deletedReqs.count} production requirements.`);

  // 3. Delete any Production Person records
  const deletedPeople = await prisma.productionPerson.deleteMany({});
  console.log(`Deleted ${deletedPeople.count} production staff members.`);

  console.log('Production Team Table data completely cleared!');
}

main()
  .catch((e) => {
    console.error('Error clearing production table:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
