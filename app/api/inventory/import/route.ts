import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function extractRowFields(raw: any, idx: number) {
  const safCode = (raw.safCode || raw['SAF Code'] || raw['saf_code'] || raw['SafCode'] || raw['code'] || `SAF-${idx + 1}`).toString().trim();
  const inventoryCategory = (raw.inventoryCategory || raw['Inventory Category'] || raw['inventory_category'] || raw['category'] || 'Technical').toString().trim();
  const subCategory = (raw.subCategory || raw['Sub Category'] || raw['sub_category'] || raw['subcategory'] || 'General').toString().trim();
  const element = (raw.element || raw['Element'] || raw['description'] || raw['Description'] || raw['element/description'] || raw['Item'] || raw['equipment'] || '').toString().trim();
  const yearOfPurchase = (raw.yearOfPurchase || raw['Year of Purchase'] || raw['year_of_purchase'] || raw['year'] || 'Na').toString().trim();
  const brandProject = (raw.brandProject || raw['Brand | Project'] || raw['Brand/Project'] || raw['brand_project'] || raw['brand'] || raw['make'] || raw['project'] || 'Na').toString().trim();
  const model = (raw.model || raw['Model'] || raw['model_no'] || raw['spec'] || 'Na').toString().trim();
  const sizeLwh = (raw.sizeLwh || raw['Size/LWH'] || raw['size_lwh'] || raw['size'] || raw['lwh'] || 'Na').toString().trim();
  const uom = (raw.uom || raw['Uom'] || raw['unit'] || 'Nos').toString().trim();
  const serialNo = (raw.serialNo || raw['Serial No'] || raw['serial_no'] || raw['serial'] || raw['srno'] || 'Na').toString().trim();
  const qtyRaw = raw.totalQuantity ?? raw['Qty'] ?? raw['qty'] ?? raw['Total Qty'] ?? raw['quantity'] ?? 1;
  const totalQuantity = parseInt(qtyRaw) || 1;
  const location = (raw.location || raw['Location'] || 'Central Warehouse').toString().trim();
  const condition = (raw.condition || raw['Condition'] || 'OK').toString().trim();
  const throwRatio = (raw.throwRatio || raw['Throw Ratio'] || raw['throw_ratio'] || raw['throw'] || 'Na').toString().trim();
  const remarks = (raw.remarks || raw['Remarks'] || raw['note'] || '').toString().trim();

  const isFaultyExplicit = raw.isFaulty === true || raw['_cellColor'] === 'RED' || raw['_isRed'] === true;
  const isFaultyCondition = /red|faulty|damaged|broken|defect|not working/i.test(condition) || /red|faulty|damaged|broken/i.test(remarks);
  const isFaulty = isFaultyExplicit || isFaultyCondition;

  return {
    rowNum: idx + 2,
    safCode,
    inventoryCategory,
    subCategory,
    element: element || 'Unnamed Element',
    yearOfPurchase,
    brandProject,
    model,
    sizeLwh,
    uom,
    serialNo,
    totalQuantity,
    location,
    condition: isFaulty ? 'Faulty (Red Flagged)' : condition,
    throwRatio,
    remarks,
    isFaulty,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, eventId, fileName, rows = [], resolutions = {}, defaultUsageType = 'TECHNICAL' } = body;

    // ACTION 1: ANALYZE / STAGE EXCEL ROWS
    if (action === 'ANALYZE') {
      const totalRows = rows.length;
      let validCount = 0;
      let warningCount = 0;
      let errorCount = 0;
      let faultyCount = 0;
      const duplicatesMap: { [safCode: string]: any[] } = {};
      const processedRows: any[] = [];

      // Check existing SAF Codes in DB for event
      const dbItems = await prisma.inventoryItem.findMany({
        where: { eventId },
        select: { safCode: true, element: true, totalQuantity: true },
      });
      const dbSafSet = new Set(dbItems.map((i) => i.safCode.toLowerCase()));

      for (let idx = 0; idx < rows.length; idx++) {
        const raw = rows[idx];
        const extracted = extractRowFields(raw, idx);

        const issues: string[] = [];
        if (extracted.element === 'Unnamed Element') {
          issues.push('Missing Element name');
        }
        if (extracted.isFaulty) {
          faultyCount++;
          issues.push('MARKED RED / FAULTY (Cannot be allocated to any artist or project)');
        }

        const isDbDuplicate = extracted.safCode ? dbSafSet.has(extracted.safCode.toLowerCase()) : false;

        const rowItem = {
          ...extracted,
          issues,
          isDbDuplicate,
        };

        if (extracted.safCode) {
          const lower = extracted.safCode.toLowerCase();
          if (!duplicatesMap[lower]) duplicatesMap[lower] = [];
          duplicatesMap[lower].push(rowItem);
        }

        if (issues.length > 0 && !extracted.isFaulty) {
          errorCount++;
        } else if (isDbDuplicate) {
          warningCount++;
        }

        processedRows.push(rowItem);
      }

      const duplicateGroups = Object.keys(duplicatesMap)
        .filter((code) => duplicatesMap[code].length > 1)
        .map((code) => ({
          safCode: code,
          rows: duplicatesMap[code],
        }));

      return NextResponse.json({
        success: true,
        summary: {
          totalRows: rows.length,
          validCount: processedRows.length - errorCount - warningCount,
          warningCount,
          errorCount,
          faultyCount,
          duplicateCount: duplicateGroups.length,
        },
        duplicateGroups,
        processedRows,
      });
    }

    // ACTION 2: OPTIMIZED TRANSACTIONAL COMMIT
    if (action === 'COMMIT') {
      const result = await prisma.$transaction(
        async (tx) => {
          let importedCount = 0;
          let mergedCount = 0;
          let skippedCount = 0;
          let faultyCount = 0;

          const importBatch = await tx.inventoryImportBatch.create({
            data: {
              eventId,
              fileName: fileName || 'Inventory TECH 2026.xlsx',
              uploadedBy: 'Admin User',
              totalRows: rows.length,
              importedRows: 0,
              updatedRows: 0,
              mergedRows: 0,
              skippedRows: 0,
              errorRows: 0,
              status: 'Processing',
            },
          });

          // Pre-fetch all existing inventory items for this event to avoid 500+ N+1 queries
          const existingDbItems = await tx.inventoryItem.findMany({
            where: { eventId },
          });
          const existingItemMap = new Map<string, any>();
          existingDbItems.forEach((item) => {
            if (item.safCode) {
              existingItemMap.set(item.safCode.toLowerCase(), item);
            }
          });

          const currentCount = existingDbItems.length;
          let assetCounter = currentCount + 1;

          for (let idx = 0; idx < rows.length; idx++) {
            const raw = rows[idx];
            const itemData = extractRowFields(raw, idx);
            const safCode = itemData.safCode;
            const safCodeLower = safCode ? safCode.toLowerCase() : '';
            const userAction =
              resolutions[safCode] ||
              (safCode ? resolutions[safCode.toLowerCase()] : null) ||
              (safCode ? resolutions[safCode.toUpperCase()] : null) ||
              'MERGE';
            const isFaulty = itemData.isFaulty === true;

            if (userAction === 'SKIP') {
              skippedCount++;
              continue;
            }

            const existingItem = existingItemMap.get(safCodeLower);

            if (existingItem) {
              if (userAction === 'MERGE' || userAction === 'IMPORT') {
                const newTotal = existingItem.totalQuantity + itemData.totalQuantity;
                const newDamaged = isFaulty ? existingItem.damagedQuantity + itemData.totalQuantity : existingItem.damagedQuantity;
                const newAvailable = Math.max(
                  0,
                  newTotal - existingItem.reservedQuantity - existingItem.allocatedQuantity - newDamaged - existingItem.maintenanceQuantity
                );

                const updatedItem = await tx.inventoryItem.update({
                  where: { id: existingItem.id },
                  data: {
                    totalQuantity: newTotal,
                    damagedQuantity: newDamaged,
                    availableQuantity: newAvailable,
                    isFaulty: existingItem.isFaulty || isFaulty,
                    condition: isFaulty ? 'Faulty (Red Flagged)' : existingItem.condition,
                    remarks: `${existingItem.remarks || ''} | Merged Row ${itemData.rowNum} Qty: +${itemData.totalQuantity} ${isFaulty ? '[FAULTY]' : ''}`,
                  },
                });

                // Update Map cache so duplicate rows within the same batch stack correctly
                existingItemMap.set(safCodeLower, updatedItem);

                if (isFaulty) faultyCount++;
                mergedCount++;
                continue;
              }
            }

            const assetId = `INV-${String(assetCounter++).padStart(6, '0')}`;
            const totalQty = itemData.totalQuantity || 0;
            const damagedQty = isFaulty ? totalQty : 0;
            const availQty = isFaulty ? 0 : totalQty;

            const newItem = await tx.inventoryItem.create({
              data: {
                eventId,
                safCode,
                inventoryCategory: itemData.inventoryCategory || 'Technical',
                subCategory: itemData.subCategory || 'General',
                element: itemData.element,
                yearOfPurchase: itemData.yearOfPurchase || 'Na',
                brandProject: itemData.brandProject || 'Na',
                model: itemData.model || 'Na',
                sizeLwh: itemData.sizeLwh || 'Na',
                uom: itemData.uom || 'Nos',
                serialNo: itemData.serialNo || 'Na',
                totalQuantity: totalQty,
                damagedQuantity: damagedQty,
                availableQuantity: availQty,
                isFaulty,
                location: itemData.location || 'Central Warehouse',
                condition: isFaulty ? 'Faulty (Red Flagged)' : (itemData.condition || 'OK'),
                throwRatio: itemData.throwRatio || 'Na',
                remarks: itemData.remarks || '',
                inventoryUsageType: defaultUsageType,
                assetId,
                createdBy: 'Excel Import Wizard',
              },
            });

            if (safCodeLower) {
              existingItemMap.set(safCodeLower, newItem);
            }

            await tx.inventoryMovement.create({
              data: {
                eventId,
                inventoryItemId: newItem.id,
                movementType: isFaulty ? 'Damaged' : 'Stock Added',
                quantity: totalQty,
                previousTotal: 0,
                newTotal: totalQty,
                previousAvailable: 0,
                newAvailable: availQty,
                performedBy: 'Excel Import Wizard',
                reason: isFaulty
                  ? 'Item marked RED / FAULTY in uploaded Excel sheet (Cannot be allocated)'
                  : `Batch imported from ${fileName}`,
              },
            });

            if (isFaulty) faultyCount++;
            importedCount++;
          }

          await tx.inventoryImportBatch.update({
            where: { id: importBatch.id },
            data: {
              importedRows: importedCount,
              mergedRows: mergedCount,
              skippedRows: skippedCount,
              status: 'Completed',
            },
          });

          return {
            batchId: importBatch.id,
            importedCount,
            mergedCount,
            skippedCount,
            faultyCount,
          };
        },
        {
          timeout: 120000, // 2 minutes transaction timeout for large excel batches
          maxWait: 20000,
        }
      );

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
