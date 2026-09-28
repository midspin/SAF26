const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSafCodes() {
  console.log('Fixing SAF Codes in database...');
  const items = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const categoryCounters = {};

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    
    // Check if safCode looks like a timestamp fallback (e.g. SAF-1789...)
    if (/^SAF-\d{10,}/i.test(item.safCode) || /^GEN-ROW-/i.test(item.safCode) || !item.safCode) {
      let prefix = 'AC';
      const cat = (item.inventoryCategory || '').toLowerCase();
      const sub = (item.subCategory || '').toLowerCase();
      const elem = (item.element || '').toLowerCase();

      if (cat.includes('tech') || sub.includes('cable') || elem.includes('hdmi') || elem.includes('projector')) {
        prefix = 'Ac';
      } else if (sub.includes('audio') || sub.includes('sound') || elem.includes('speaker')) {
        prefix = 'Snd';
      } else if (sub.includes('light') || elem.includes('lamp') || elem.includes('spot')) {
        prefix = 'Lg';
      } else if (sub.includes('display') || elem.includes('screen') || elem.includes('monitor')) {
        prefix = 'Disp';
      } else if (sub.includes('fabr') || sub.includes('wood') || sub.includes('metal')) {
        prefix = 'Fab';
      } else {
        prefix = 'SAF';
      }

      categoryCounters[prefix] = (categoryCounters[prefix] || 0) + 1;
      const cleanSafCode = `${prefix}-${String(categoryCounters[prefix]).padStart(2, '0')}`;

      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { safCode: cleanSafCode },
      });
      console.log(`Updated item "${item.element}" (${item.id}) safCode: ${item.safCode} -> ${cleanSafCode}`);
    }
  }

  console.log('SAF Codes cleanup complete!');
  await prisma.$disconnect();
}

fixSafCodes();
