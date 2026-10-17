const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- MOVING VIDEO & TELEPHONE ITEMS TO TECHNICAL CATEGORY ---');

  const beforeItems = await prisma.inventoryItem.findMany({
    where: {
      subCategory: { in: ['Video', 'Telephone'], mode: 'insensitive' }
    },
    select: {
      id: true,
      safCode: true,
      inventoryCategory: true,
      inventoryUsageType: true,
      subCategory: true,
      element: true
    }
  });

  console.log(`Found ${beforeItems.length} items with SubCategory Video/Telephone.`);

  const updateResult = await prisma.inventoryItem.updateMany({
    where: {
      subCategory: { in: ['Video', 'Telephone'], mode: 'insensitive' }
    },
    data: {
      inventoryCategory: 'Technical',
      inventoryUsageType: 'TECHNICAL'
    }
  });

  console.log(`Successfully updated ${updateResult.count} items to Technical category / TECHNICAL usage type.`);

  // Verify the updated items
  const afterItems = await prisma.inventoryItem.findMany({
    where: {
      subCategory: { in: ['Video', 'Telephone'], mode: 'insensitive' }
    },
    select: {
      id: true,
      safCode: true,
      inventoryCategory: true,
      inventoryUsageType: true,
      subCategory: true,
      element: true
    }
  });

  const catCount = {};
  afterItems.forEach(i => {
    const key = `${i.inventoryCategory} / ${i.inventoryUsageType} / Sub: ${i.subCategory}`;
    catCount[key] = (catCount[key] || 0) + 1;
  });

  console.log('Post-migration breakdown:', catCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
