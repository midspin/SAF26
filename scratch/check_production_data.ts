import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.inventoryItem.count({
    where: { inventoryUsageType: 'PRODUCTION' },
  });
  console.log('Total Production Items in Database:', count);

  const sample = await prisma.inventoryItem.findMany({
    where: { inventoryUsageType: 'PRODUCTION' },
    take: 5,
    select: {
      safCode: true,
      inventoryCategory: true,
      subCategory: true,
      element: true,
      location: true,
      totalQuantity: true,
      condition: true,
    },
  });

  console.log('Sample Items:');
  console.table(sample);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
