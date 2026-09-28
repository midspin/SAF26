const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUnflag() {
  const item = await prisma.inventoryItem.findFirst({ where: { isFaulty: true } });
  if (!item) {
    console.log('No faulty items found in DB to test.');
    return;
  }

  console.log(`Found faulty item: ${item.safCode} (${item.element}) - Condition: ${item.condition}`);
  
  // Unflag item
  const updated = await prisma.inventoryItem.update({
    where: { id: item.id },
    data: {
      isFaulty: false,
      condition: 'OK',
      damagedQuantity: 0,
      availableQuantity: item.totalQuantity,
      remarks: `${item.remarks || ''} | Unflagged & Restored to live stock`,
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      eventId: item.eventId,
      inventoryItemId: item.id,
      movementType: 'Repaired / Unflagged',
      quantity: item.damagedQuantity || item.totalQuantity,
      previousTotal: item.totalQuantity,
      newTotal: item.totalQuantity,
      previousAvailable: 0,
      newAvailable: item.totalQuantity,
      performedBy: 'Admin User',
      reason: 'Unflagged faulty status - restored item to active live inventory',
    },
  });

  console.log(`SUCCESS: Unflagged ${updated.safCode}! New Condition: ${updated.condition}, Available: ${updated.availableQuantity}/${updated.totalQuantity}`);
}

testUnflag()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
