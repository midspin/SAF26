const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING FAST TECHNICAL INVENTORY BATCH IMPORT ---');

  // 1. Get Event (Optional)
  const event = await prisma.event.findFirst();
  const eventId = event ? event.id : null;
  console.log(`Target Event: ${event ? event.name : 'Master Inventory (Global)'}`);

  // 2. Read CSV
  const csvPath = path.join(__dirname, 'tech_inventory_input.csv');
  const workbook = XLSX.readFile(csvPath);
  const sheetName = workbook.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Parsed ${rawRows.length} raw rows from CSV.`);

  // 3. Clear existing technical items
  console.log('Clearing existing TECHNICAL inventory items...');
  const deleteResult = await prisma.inventoryItem.deleteMany({
    where: {
      ...(eventId ? { eventId } : {}),
      OR: [
        { inventoryCategory: { equals: 'Technical', mode: 'insensitive' } },
        { inventoryUsageType: 'TECHNICAL' }
      ]
    }
  });
  console.log(`Deleted ${deleteResult.count} old technical items.`);

  // 4. Prepare batch records
  const itemsToCreate = [];
  const movementsToCreate = [];
  let faultyCount = 0;
  let skippedEmpty = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const safCode = (row['SAF Code'] || row['saf_code'] || '').toString().trim();
    const element = (row['Element'] || row['element'] || row['Description'] || '').toString().trim();

    if (!safCode && !element) {
      skippedEmpty++;
      continue;
    }

    const subCategory = (row['Sub Category'] || row['subCategory'] || 'General').toString().trim();
    const yearOfPurchase = (row['Year of Purchase'] || row['yearOfPurchase'] || 'Na').toString().trim();
    const brandProject = (row['Brand | Project '] || row['Brand | Project'] || row['brandProject'] || 'Na').toString().trim();
    const model = (row['Model'] || row['model'] || 'Na').toString().trim();
    const sizeLwh = (row['Size/LWH'] || row['sizeLwh'] || 'Na').toString().trim();
    const uom = (row['Uom'] || row['uom'] || 'Nos').toString().trim();
    const serialNo = (row['Serial No'] || row['serialNo'] || 'Na').toString().trim();
    const qtyRaw = row['Qty'] ?? row['qty'] ?? row['totalQuantity'] ?? 1;
    const totalQuantity = Math.max(1, parseInt(qtyRaw) || 1);
    const location = (row['Location'] || row['location'] || 'Delhi Warehouse').toString().trim();
    const condition = (row['Condition'] || row['condition'] || 'Ok').toString().trim();
    const throwRatio = (row['Throw Ratio'] || row['throwRatio'] || 'Na').toString().trim();
    const remarks = (row['Remarks'] || row['remarks'] || '').toString().trim();

    const isFaulty = /red|faulty|damaged|broken|defect|not working|screen damage|flicker|bad/i.test(condition) ||
                    /red|faulty|damaged|broken|defect|not working|screen damage|flicker|bad/i.test(remarks);

    if (isFaulty) faultyCount++;

    const itemId = crypto.randomUUID();
    const assetId = `INV-TECH-${String(idx + 1).padStart(6, '0')}`;
    const damagedQuantity = isFaulty ? totalQuantity : 0;
    const availableQuantity = isFaulty ? 0 : totalQuantity;

    itemsToCreate.push({
      id: itemId,
      eventId,
      safCode: safCode || `SAF-TECH-${idx + 1}`,
      inventoryCategory: 'Technical',
      subCategory: subCategory || 'General',
      element: element || 'Technical Equipment',
      yearOfPurchase,
      brandProject,
      model,
      sizeLwh,
      uom,
      serialNo,
      totalQuantity,
      damagedQuantity,
      availableQuantity,
      reservedQuantity: 0,
      allocatedQuantity: 0,
      maintenanceQuantity: 0,
      isFaulty,
      location,
      condition: isFaulty ? `Faulty / ${condition}` : condition,
      throwRatio,
      remarks,
      inventoryUsageType: 'TECHNICAL',
      inventorySource: 'Owned',
      ownershipType: 'SAF',
      assetId,
      createdBy: 'CSV Batch Import',
    });

    movementsToCreate.push({
      id: crypto.randomUUID(),
      eventId,
      inventoryItemId: itemId,
      movementType: isFaulty ? 'Damaged' : 'Stock Added',
      quantity: totalQuantity,
      previousTotal: 0,
      newTotal: totalQuantity,
      previousAvailable: 0,
      newAvailable: availableQuantity,
      performedBy: 'CSV Batch Import',
      reason: isFaulty ? 'Marked damaged/faulty in imported CSV' : 'Initial stock import from CSV',
    });
  }

  console.log(`Prepared ${itemsToCreate.length} items for batch creation.`);

  // 5. Execute createMany in single batch
  const createItemsResult = await prisma.inventoryItem.createMany({
    data: itemsToCreate,
  });
  console.log(`Inserted ${createItemsResult.count} InventoryItem records.`);

  const createMovementsResult = await prisma.inventoryMovement.createMany({
    data: movementsToCreate,
  });
  console.log(`Inserted ${createMovementsResult.count} InventoryMovement records.`);

  console.log(`--- SUCCESS ---`);
  console.log(`Total Technical Items Imported: ${createItemsResult.count}`);
  console.log(`Flagged Damaged/Faulty Items: ${faultyCount}`);
}

main()
  .catch((e) => {
    console.error('Batch Import Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
