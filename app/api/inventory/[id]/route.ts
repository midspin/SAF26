import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determineInventoryCategory } from '@/lib/inventory-categorizer';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        vendor: true,
        allocations: {
          include: {
            artist: true,
            artwork: true,
            venue: true,
            room: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

    const totalQty = body.totalQuantity !== undefined ? parseInt(body.totalQuantity) : existing.totalQuantity;
    const reservedQty = body.reservedQuantity !== undefined ? parseInt(body.reservedQuantity) : existing.reservedQuantity;
    const allocatedQty = existing.allocatedQuantity; // Calculated from active allocations
    const damagedQty = body.damagedQuantity !== undefined ? parseInt(body.damagedQuantity) : existing.damagedQuantity;
    const maintenanceQty = body.maintenanceQuantity !== undefined ? parseInt(body.maintenanceQuantity) : existing.maintenanceQuantity;

    // Formula: AVAILABLE = TOTAL - RESERVED - ALLOCATED - DAMAGED - MAINTENANCE
    const calculatedAvailable = Math.max(0, totalQty - reservedQty - allocatedQty - damagedQty - maintenanceQty);

    const targetSubCategory = body.subCategory || existing.subCategory;
    const { inventoryCategory: computedCat, inventoryUsageType: computedUsage } = determineInventoryCategory(
      targetSubCategory,
      body.inventoryCategory || existing.inventoryCategory
    );

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        safCode: body.safCode || existing.safCode,
        inventoryCategory: computedCat,
        subCategory: targetSubCategory,
        element: body.element || existing.element,
        yearOfPurchase: body.yearOfPurchase || existing.yearOfPurchase,
        brandProject: body.brandProject || existing.brandProject,
        model: body.model || existing.model,
        sizeLwh: body.sizeLwh || existing.sizeLwh,
        uom: body.uom || existing.uom,
        serialNo: body.serialNo || existing.serialNo,
        totalQuantity: totalQty,
        reservedQuantity: reservedQty,
        damagedQuantity: damagedQty,
        maintenanceQuantity: maintenanceQty,
        availableQuantity: calculatedAvailable,
        location: body.location || existing.location,
        condition: body.condition || existing.condition,
        throwRatio: body.throwRatio || existing.throwRatio,
        remarks: body.remarks !== undefined ? body.remarks : existing.remarks,
        inventoryUsageType: computedUsage,
        inventorySource: body.inventorySource || existing.inventorySource,
        ownershipType: body.ownershipType || existing.ownershipType,
        vendorId: body.vendorId !== undefined ? body.vendorId : existing.vendorId,
        purchaseLink: body.purchaseLink !== undefined ? body.purchaseLink : existing.purchaseLink,
        rentalLink: body.rentalLink !== undefined ? body.rentalLink : existing.rentalLink,
        image: body.image !== undefined ? body.image : existing.image,
        isFaulty: body.isFaulty !== undefined ? body.isFaulty : existing.isFaulty,
      },
    });

    if (totalQty !== existing.totalQuantity) {
      await prisma.inventoryMovement.create({
        data: {
          eventId: existing.eventId,
          inventoryItemId: id,
          movementType: 'Stock Adjustment',
          quantity: totalQty - existing.totalQuantity,
          previousTotal: existing.totalQuantity,
          newTotal: totalQty,
          previousAvailable: existing.availableQuantity,
          newAvailable: calculatedAvailable,
          performedBy: body.updatedBy || 'Admin User',
          reason: body.adjustmentReason || 'Manual Inventory Adjustment',
        },
      });
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, condition = 'OK', performedBy = 'Admin User', notes = '' } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });

    if (action === 'UNFLAG_FAULTY') {
      const newDamagedQty = 0;
      const calculatedAvailable = Math.max(0, existing.totalQuantity - existing.reservedQuantity - existing.allocatedQuantity - existing.maintenanceQuantity);

      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          isFaulty: false,
          condition: condition || 'OK',
          damagedQuantity: newDamagedQty,
          availableQuantity: calculatedAvailable,
          remarks: notes ? `${existing.remarks || ''} | Unflagged: ${notes}` : existing.remarks,
        },
      });

      // Audit movement record
      await prisma.inventoryMovement.create({
        data: {
          eventId: existing.eventId,
          inventoryItemId: id,
          movementType: 'Repaired / Unflagged',
          quantity: existing.damagedQuantity || existing.totalQuantity,
          previousTotal: existing.totalQuantity,
          newTotal: existing.totalQuantity,
          previousAvailable: existing.availableQuantity,
          newAvailable: calculatedAvailable,
          performedBy,
          reason: notes || 'Unflagged faulty status - restored item to active live inventory',
        },
      });

      return NextResponse.json({
        success: true,
        item: updated,
        message: 'Item successfully unflagged and restored to live inventory!',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
