import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// Get Google Sheets API client
export function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return null;
  }

  // Handle line breaks in private key
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function syncAllToGoogleSheets(eventId?: string) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const techWorkbookId = process.env.GOOGLE_SHEETS_TECH_ID;
  const prodWorkbookId = process.env.GOOGLE_SHEETS_PROD_ID;

  if (!email || !privateKey || (!techWorkbookId && !prodWorkbookId)) {
    return {
      success: false,
      configured: false,
      message: 'Google Sheets API environment variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_TECH_ID, GOOGLE_SHEETS_PROD_ID) are missing or incomplete in .env file.',
    };
  }

  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    return {
      success: false,
      configured: false,
      message: 'Failed to initialize Google Authentication client.',
    };
  }

  let totalUpdatedRows = 0;
  const syncResults: any[] = [];

  try {
    // -------------------------------------------------------------
    // 1. SYNC MASTER INVENTORY ITEMS -> Technical Workbook (Tab 1: FULL INVENTORY)
    // -------------------------------------------------------------
    if (techWorkbookId) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: eventId ? { eventId } : undefined,
        orderBy: { safCode: 'asc' },
      });

      const inventoryHeaders = [
        'Item ID',
        'SAF Code',
        'Item Element / Name',
        'Category',
        'Sub Category',
        'Usage Type',
        'Total Quantity',
        'Available Quantity',
        'Allocated Quantity',
        'Damaged Quantity',
        'Condition',
        'Storage Location',
        'Serial Number',
        'Purchase Cost',
        'Remarks',
        'Last Synced At',
      ];

      const inventoryRows = inventoryItems.map((item) => [
        item.id,
        item.safCode || '',
        item.element || '',
        item.inventoryCategory || '',
        item.subCategory || '',
        item.inventoryUsageType || 'TECHNICAL',
        item.totalQuantity ?? 0,
        item.availableQuantity ?? 0,
        item.allocatedQuantity ?? 0,
        item.damagedQuantity ?? 0,
        item.condition || 'OK',
        item.location || '',
        item.serialNo || '',
        item.purchaseCost ? item.purchaseCost.toString() : '0',
        item.remarks || '',
        new Date().toISOString(),
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: techWorkbookId,
        range: 'FULL INVENTORY!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [inventoryHeaders, ...inventoryRows],
        },
      });

      totalUpdatedRows += inventoryRows.length;

      // Log sync records in Prisma
      for (const item of inventoryItems) {
        await prisma.googleSheetSyncLog.create({
          data: {
            eventId: item.eventId,
            workbookId: techWorkbookId,
            tabName: 'FULL INVENTORY',
            entityType: 'INVENTORY',
            entityId: item.id,
            operation: 'UPDATE',
            status: 'Synced',
            syncedAt: new Date(),
          },
        });
      }

      syncResults.push({
        workbook: 'Technical Inventory',
        tab: 'FULL INVENTORY',
        syncedRows: inventoryRows.length,
      });
    }

    // -------------------------------------------------------------
    // 2. SYNC ALLOCATIONS -> Technical Workbook (Tab 2) & Production Workbook (Tab 1)
    // -------------------------------------------------------------
    const allocations = await prisma.inventoryAllocation.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        inventoryItem: true,
        artist: true,
        artwork: true,
        venue: true,
        room: true,
      },
    });

    const allocationHeaders = [
      'Allocation ID',
      'SAF Code',
      'Item Name',
      'Approved Qty',
      'Usage Type',
      'Assigned Artist',
      'Assigned Artwork',
      'Assigned Venue',
      'Assigned Room',
      'Status',
      'Allocated At',
    ];

    // Filter Technical vs Production allocations
    const techAllocations = allocations.filter(
      (a) => (a.inventoryItem?.inventoryUsageType || a.department || 'TECHNICAL').toUpperCase() === 'TECHNICAL'
    );
    const prodAllocations = allocations.filter(
      (a) => (a.inventoryItem?.inventoryUsageType || a.department || 'TECHNICAL').toUpperCase() !== 'TECHNICAL'
    );

    // Sync Tech Allocations
    if (techWorkbookId) {
      const techRows = techAllocations.map((a) => [
        a.id,
        a.inventoryItem?.safCode || '',
        a.inventoryItem?.element || '',
        a.approvedQuantity || a.requestedQuantity || 1,
        a.inventoryItem?.inventoryUsageType || a.department || 'TECHNICAL',
        a.artist?.artistName || '',
        a.artwork?.artworkName || '',
        a.venue?.venueName || '',
        a.room?.roomName || '',
        a.status || 'Approved',
        a.createdAt ? new Date(a.createdAt).toISOString() : '',
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: techWorkbookId,
        range: 'TECHNICAL ALLOCATION!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [allocationHeaders, ...techRows],
        },
      });

      totalUpdatedRows += techRows.length;
      syncResults.push({
        workbook: 'Technical Inventory',
        tab: 'TECHNICAL ALLOCATION',
        syncedRows: techRows.length,
      });
    }

    // Sync Production Allocations
    if (prodWorkbookId) {
      const prodRows = prodAllocations.map((a) => [
        a.id,
        a.inventoryItem?.safCode || '',
        a.inventoryItem?.element || '',
        a.approvedQuantity || a.requestedQuantity || 1,
        a.inventoryItem?.inventoryUsageType || a.department || 'PRODUCTION',
        a.artist?.artistName || '',
        a.artwork?.artworkName || '',
        a.venue?.venueName || '',
        a.room?.roomName || '',
        a.status || 'Approved',
        a.createdAt ? new Date(a.createdAt).toISOString() : '',
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: prodWorkbookId,
        range: 'OTHER / PRODUCTION ALLOCATION!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [allocationHeaders, ...prodRows],
        },
      });

      totalUpdatedRows += prodRows.length;
      syncResults.push({
        workbook: 'Production Inventory',
        tab: 'OTHER / PRODUCTION ALLOCATION',
        syncedRows: prodRows.length,
      });
    }

    // -------------------------------------------------------------
    // 3. SYNC PROCUREMENT -> Technical Workbook (Tab 3) & Production Workbook (Tab 2)
    // -------------------------------------------------------------
    const purchases = await prisma.purchaseRequest.findMany({
      where: eventId ? { eventId } : undefined,
      include: { artist: true, artwork: true, venue: true, room: true, vendor: true },
    });

    const procurementHeaders = [
      'Request ID',
      'Item Description',
      'Category',
      'Request Type',
      'Quantity',
      'Estimated Unit Cost',
      'Vendor / Supplier',
      'Department / Usage',
      'Status',
      'Requested By',
      'Created At',
    ];

    const techPurchases = purchases.filter(
      (p) => (p.department || 'TECHNICAL').toUpperCase() === 'TECHNICAL'
    );
    const prodPurchases = purchases.filter(
      (p) => (p.department || 'TECHNICAL').toUpperCase() !== 'TECHNICAL'
    );

    if (techWorkbookId) {
      const techRows = techPurchases.map((p) => [
        p.id,
        p.itemName || '',
        p.category || '',
        p.itemType || 'Purchase',
        p.quantity || 1,
        p.estimatedUnitCost ? p.estimatedUnitCost.toString() : '0',
        p.vendor?.company || p.vendor?.name || '',
        'TECHNICAL',
        p.status || 'Request Raised',
        p.requestedBy || '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: techWorkbookId,
        range: 'TECHNICAL PROCUREMENT!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [procurementHeaders, ...techRows],
        },
      });

      totalUpdatedRows += techRows.length;
      syncResults.push({
        workbook: 'Technical Inventory',
        tab: 'TECHNICAL PROCUREMENT',
        syncedRows: techRows.length,
      });
    }

    if (prodWorkbookId) {
      const prodRows = prodPurchases.map((p) => [
        p.id,
        p.itemName || '',
        p.category || '',
        p.itemType || 'Purchase',
        p.quantity || 1,
        p.estimatedUnitCost ? p.estimatedUnitCost.toString() : '0',
        p.vendor?.company || p.vendor?.name || '',
        'PRODUCTION',
        p.status || 'Request Raised',
        p.requestedBy || '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: prodWorkbookId,
        range: 'OTHER / PRODUCTION PROCUREMENT!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [procurementHeaders, ...prodRows],
        },
      });

      totalUpdatedRows += prodRows.length;
      syncResults.push({
        workbook: 'Production Inventory',
        tab: 'OTHER / PRODUCTION PROCUREMENT',
        syncedRows: prodRows.length,
      });
    }

    return {
      success: true,
      configured: true,
      totalUpdatedRows,
      syncResults,
      message: `Successfully synchronized ${totalUpdatedRows} rows directly into Google Sheets workbooks!`,
    };
  } catch (error: any) {
    console.error('Google Sheets live sync error:', error);
    return {
      success: false,
      configured: true,
      error: error.message,
      message: `Failed to stream to Google Sheets: ${error.message}`,
    };
  }
}
