const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepts() {
  const items = await prisma.inventoryItem.findMany();
  const usageTypes = {};
  const categories = {};
  items.forEach(i => {
    usageTypes[i.inventoryUsageType] = (usageTypes[i.inventoryUsageType] || 0) + 1;
    categories[i.inventoryCategory] = (categories[i.inventoryCategory] || 0) + 1;
  });
  console.log('Usage Types count:', usageTypes);
  console.log('Categories count:', categories);
  
  // Search items containing "white"
  const whiteItems = items.filter(i => 
    (i.safCode && i.safCode.toLowerCase().includes('white')) ||
    (i.element && i.element.toLowerCase().includes('white')) ||
    (i.subCategory && i.subCategory.toLowerCase().includes('white')) ||
    (i.brandProject && i.brandProject.toLowerCase().includes('white')) ||
    (i.model && i.model.toLowerCase().includes('white')) ||
    (i.remarks && i.remarks.toLowerCase().includes('white'))
  );
  console.log('\nItems matching "white":', whiteItems.length);
  whiteItems.slice(0, 10).forEach(i => {
    console.log(`[${i.safCode}] ${i.element} | UsageType: ${i.inventoryUsageType} | Cat: ${i.inventoryCategory} | Avail: ${i.availableQuantity}`);
  });

  await prisma.$disconnect();
}

checkDepts();
