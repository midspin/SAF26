import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const peopleCount = await prisma.productionPerson.count();
  const reqsCount = await prisma.productionRequirement.count();
  const itemsCount = await prisma.inventoryItem.count({ where: { inventoryUsageType: 'PRODUCTION' } });
  const allocsCount = await prisma.inventoryAllocation.count({ where: { department: 'PRODUCTION' } });
  const purchaseCount = await prisma.purchaseRequest.count({ where: { department: 'PRODUCTION' } });
  const rentalCount = await prisma.rentalRecord.count({ where: { department: 'PRODUCTION' } });

  console.log('Production Data Counts:');
  console.log(`- Production Persons (Staff): ${peopleCount}`);
  console.log(`- Production Requirements: ${reqsCount}`);
  console.log(`- Production Inventory Items: ${itemsCount}`);
  console.log(`- Production Inventory Allocations: ${allocsCount}`);
  console.log(`- Production Purchase Requests: ${purchaseCount}`);
  console.log(`- Production Rental Records: ${rentalCount}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
