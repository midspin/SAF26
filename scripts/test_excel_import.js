const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpload() {
  const event = await prisma.event.findFirst({ where: { code: 'SAF2026' } });
  if (!event) throw new Error('Event not found');

  const sampleItems = [
    {
      safCode: 'Ac-1',
      inventoryCategory: 'Technical',
      subCategory: 'Audio & Visual',
      element: 'Sony 4K Laser Projector 10,000 Lumens',
      yearOfPurchase: '2023',
      brandProject: 'Sony / SAF 2026 Main Stage',
      model: 'VPL-FHZ85',
      sizeLwh: '460 x 169 x 493 mm',
      uom: 'Nos',
      serialNo: 'SN-998412-X',
      totalQuantity: 4,
      availableQuantity: 4,
      location: 'Central Warehouse Store A',
      condition: 'OK',
      throwRatio: '1.2 - 1.8:1',
      remarks: 'High performance laser projector for main gallery',
    },
    {
      safCode: 'Ac-2',
      inventoryCategory: 'Technical',
      subCategory: 'Cables & Accessories',
      element: 'Heavy Duty 4K Optical HDMI Cable 20m',
      yearOfPurchase: '2024',
      brandProject: 'Kramer / Cable Rigging',
      model: 'CLS-AOCH/60',
      sizeLwh: '20 Meters',
      uom: 'Pcs',
      serialNo: 'KRM-2024-88',
      totalQuantity: 15,
      availableQuantity: 15,
      location: 'Warehouse Rack B3',
      condition: 'OK',
      throwRatio: 'Na',
      remarks: 'Active optical fiber cable set',
    },
    {
      safCode: 'FLT-09',
      inventoryCategory: 'Technical',
      subCategory: 'Display Equipment',
      element: 'LG 65-inch Commercial OLED Monitor [DAMAGED SCREEN]',
      yearOfPurchase: '2022',
      brandProject: 'LG Electronics',
      model: '65US660H',
      sizeLwh: '65 inch',
      uom: 'Nos',
      serialNo: 'LG-FLT-0092',
      totalQuantity: 1,
      availableQuantity: 0,
      damagedQuantity: 1,
      isFaulty: true,
      location: 'Quarantine Repair Bay',
      condition: 'Faulty (Red Flagged)',
      throwRatio: 'Na',
      remarks: 'Row marked RED in Excel - Screen cracked during transit',
    }
  ];

  console.log('Clearing old data and inserting full 15-column sample items...');
  await prisma.inventoryAllocation.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();

  let assetCounter = 1;
  for (const item of sampleItems) {
    await prisma.inventoryItem.create({
      data: {
        eventId: event.id,
        assetId: `INV-${String(assetCounter++).padStart(6, '0')}`,
        safCode: item.safCode,
        inventoryCategory: item.inventoryCategory,
        subCategory: item.subCategory,
        element: item.element,
        yearOfPurchase: item.yearOfPurchase,
        brandProject: item.brandProject,
        model: item.model,
        sizeLwh: item.sizeLwh,
        uom: item.uom,
        serialNo: item.serialNo,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        damagedQuantity: item.damagedQuantity || 0,
        isFaulty: item.isFaulty || false,
        location: item.location,
        condition: item.condition,
        throwRatio: item.throwRatio,
        remarks: item.remarks,
        inventoryUsageType: 'TECHNICAL',
        createdBy: 'Excel Import Wizard',
      }
    });
  }

  console.log('SUCCESS: Inserted sample items with complete 15 fields.');
}

testUpload()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
