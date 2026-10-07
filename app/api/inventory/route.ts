import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search');
    const usageType = searchParams.get('usageType');
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');

    const where: any = {};
    if (eventId && eventId !== 'ALL') {
      where.OR = [{ eventId }, { eventId: null }];
    }
    if (usageType && usageType !== 'ALL') where.inventoryUsageType = usageType;
    if (category && category !== 'ALL') where.inventoryCategory = category;
    if (condition && condition !== 'ALL') where.condition = condition;

    if (search) {
      const q = search.trim();
      const searchConditions = [
        { safCode: { contains: q } },
        { element: { contains: q } },
        { inventoryCategory: { contains: q } },
        { subCategory: { contains: q } },
        { model: { contains: q } },
        { serialNo: { contains: q } },
        { brandProject: { contains: q } },
        { location: { contains: q } },
        { assetId: { contains: q } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { safCode: 'asc' },
      include: {
        vendor: true,
        allocations: {
          include: {
            artist: true,
            venue: true,
            room: true,
          },
        },
        _count: {
          select: { allocations: true, movements: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, items },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      safCode,
      inventoryCategory,
      subCategory,
      element,
      yearOfPurchase,
      brandProject,
      model,
      sizeLwh,
      uom,
      serialNo,
      totalQuantity,
      location,
      condition,
      throwRatio,
      remarks,
      inventoryUsageType,
      inventorySource,
      ownershipType,
      vendorId,
      purchaseDate,
      purchaseCost,
      rentalStartDate,
      rentalEndDate,
      purchaseLink,
      rentalLink,
      image,
      createdBy,
    } = body;

    // Check SAF Code Uniqueness within event
    const existing = await prisma.inventoryItem.findFirst({
      where: { eventId, safCode },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `SAF Code "${safCode}" already exists in this event. Unique SAF Code required or resolve via Excel Import duplicate wizard.`,
          isDuplicate: true,
        },
        { status: 400 }
      );
    }

    const totalQty = parseInt(totalQuantity) || 0;
    const reservedQty = 0;
    const allocatedQty = 0;
    const damagedQty = 0;
    const maintenanceQty = 0;
    const availableQty = totalQty - reservedQty - allocatedQty - damagedQty - maintenanceQty;

    // Generate internal asset ID
    const itemCount = await prisma.inventoryItem.count();
    const assetId = `INV-${String(itemCount + 1).padStart(6, '0')}`;

    const item = await prisma.inventoryItem.create({
      data: {
        eventId,
        safCode: safCode || `SAF-${Date.now()}`,
        inventoryCategory: inventoryCategory || 'Technical',
        subCategory: subCategory || 'General',
        element: element || 'Item',
        yearOfPurchase: yearOfPurchase || '2026',
        brandProject: brandProject || 'Na',
        model: model || 'Na',
        sizeLwh: sizeLwh || 'Na',
        uom: uom || 'Nos',
        serialNo: serialNo || 'Na',
        totalQuantity: totalQty,
        reservedQuantity: reservedQty,
        allocatedQuantity: allocatedQty,
        damagedQuantity: damagedQty,
        maintenanceQuantity: maintenanceQty,
        availableQuantity: Math.max(0, availableQty),
        location: location || 'Central Warehouse',
        condition: condition || 'OK',
        throwRatio: throwRatio || 'Na',
        remarks: remarks || '',
        inventoryUsageType: inventoryUsageType || 'TECHNICAL',
        inventorySource: inventorySource || 'Owned',
        ownershipType: ownershipType || 'SAF',
        isFaulty: body.isFaulty !== undefined ? Boolean(body.isFaulty) : Boolean(/faulty|damaged|red/i.test(condition || '')),
        assetId,
        vendorId: vendorId || null,
        purchaseDate,
        purchaseCost: parseFloat(purchaseCost) || null,
        rentalStartDate,
        rentalEndDate,
        purchaseLink,
        rentalLink,
        image,
        createdBy: createdBy || 'Admin User',
      },
    });

    // Record Opening Movement
    await prisma.inventoryMovement.create({
      data: {
        eventId,
        inventoryItemId: item.id,
        movementType: 'Stock Added',
        quantity: totalQty,
        previousTotal: 0,
        newTotal: totalQty,
        previousAvailable: 0,
        newAvailable: availableQty,
        performedBy: createdBy || 'Admin User',
        reason: 'New Manual Inventory Entry',
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId,
        userName: createdBy || 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'INVENTORY_ITEM',
        entityId: item.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(item),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    const reason = searchParams.get('reason') || 'Retired / Damaged Beyond Repair';
    const quantityStr = searchParams.get('quantity');
    const userName = searchParams.get('user') || 'Admin User';

    if (!itemId) return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });

    const retireQty = quantityStr ? parseInt(quantityStr) : item.totalQuantity;
    const newTotal = Math.max(0, item.totalQuantity - retireQty);
    const newAvailable = Math.max(
      0,
      newTotal - item.reservedQuantity - item.allocatedQuantity - item.damagedQuantity - item.maintenanceQuantity
    );

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        totalQuantity: newTotal,
        availableQuantity: newAvailable,
        inventoryStatus: newTotal === 0 ? 'Retired' : item.inventoryStatus,
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        eventId: item.eventId,
        inventoryItemId: item.id,
        movementType: 'Retired',
        quantity: retireQty,
        previousTotal: item.totalQuantity,
        newTotal,
        previousAvailable: item.availableQuantity,
        newAvailable,
        performedBy: userName,
        reason: `Inventory Removal/Retirement: ${reason}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: item.eventId,
        userName,
        userRole: 'INVENTORY',
        entityType: 'INVENTORY_ITEM',
        entityId: item.id,
        action: 'RETIRE',
        previousValueJson: JSON.stringify({ totalQuantity: item.totalQuantity, availableQuantity: item.availableQuantity }),
        newValueJson: JSON.stringify({ totalQuantity: newTotal, availableQuantity: newAvailable, reason }),
      },
    });

    return NextResponse.json({ success: true, item: updatedItem, retiredQuantity: retireQty });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
