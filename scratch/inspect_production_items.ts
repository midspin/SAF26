import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { inventoryUsageType: 'PRODUCTION' },
    select: { id: true, safCode: true, element: true, inventoryCategory: true, subCategory: true },
  });

  console.log('Production Inventory Items (22):');
  items.forEach((i, idx) => {
    console.log(`${idx + 1}. [${i.safCode}] ${i.element} (${i.inventoryCategory} / ${i.subCategory})`);
  });
}

main().finally(() => prisma.$disconnect());
