const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAllocation() {
  const artist = await prisma.artist.findFirst();
  const invItem = await prisma.inventoryItem.findFirst({ where: { isFaulty: false, availableQuantity: { gt: 0 } } });

  if (!artist || !invItem) {
    console.log('Artist or available item not found.');
    return;
  }

  console.log(`Testing allocation of [${invItem.safCode}] "${invItem.element}" (Available: ${invItem.availableQuantity}) to Artist "${artist.artistName}"...`);

  const reqQty = 1;
  const newAllocated = invItem.allocatedQuantity + reqQty;
  const newAvailable = Math.max(0, invItem.totalQuantity - invItem.reservedQuantity - newAllocated - invItem.damagedQuantity - invItem.maintenanceQuantity);

  const allocation = await prisma.inventoryAllocation.create({
    data: {
      eventId: invItem.eventId,
      inventoryItemId: invItem.id,
      artistId: artist.id,
      department: invItem.inventoryUsageType || 'TECHNICAL',
      requestedQuantity: reqQty,
      approvedQuantity: reqQty,
      issuedQuantity: reqQty,
      status: 'Issued',
      requestedBy: 'Admin Operations',
      approvedBy: 'Admin Operations',
      issuedBy: 'Admin Operations',
      allocationDate: new Date().toISOString().split('T')[0],
      notes: 'Test allocation from Section 6 verification',
    },
  });

  await prisma.inventoryItem.update({
    where: { id: invItem.id },
    data: {
      allocatedQuantity: newAllocated,
      availableQuantity: newAvailable,
    },
  });

  console.log(`SUCCESS: Created allocation ${allocation.id}! New item available qty: ${newAvailable}`);
}

testAllocation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
