const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeInventory() {
  console.log('Wiping all inventory records from database...');
  
  const deletedAllocations = await prisma.inventoryAllocation.deleteMany({});
  console.log(`Deleted ${deletedAllocations.count} inventory allocations.`);

  const deletedMovements = await prisma.inventoryMovement.deleteMany({});
  console.log(`Deleted ${deletedMovements.count} inventory movements.`);

  const deletedItems = await prisma.inventoryItem.deleteMany({});
  console.log(`Deleted ${deletedItems.count} inventory items.`);

  const deletedBatches = await prisma.inventoryImportBatch.deleteMany({});
  console.log(`Deleted ${deletedBatches.count} inventory import batches.`);

  console.log('SUCCESS: All inventory data has been deleted! The Master Inventory Pool is clean and ready for fresh upload.');
}

wipeInventory()
  .catch((e) => {
    console.error('Error wiping inventory:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
