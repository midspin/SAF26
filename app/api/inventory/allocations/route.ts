import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const artistId = searchParams.get('artistId');
    const department = searchParams.get('department');

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artistId) where.artistId = artistId;
    if (department && department !== 'ALL') where.department = department;

    const allocations = await prisma.inventoryAllocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryItem: true,
        artist: true,
        artwork: true,
        venue: true,
        room: true,
      },
    });

    return NextResponse.json({ success: true, allocations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      inventoryItemId,
      artistId,
      artworkId,
      venueId,
      roomId,
      department,
      requestedQuantity,
      approvedBy,
      requiredDate,
      returnDueDate,
      notes,
    } = body;

    const reqQty = parseInt(requestedQuantity) || 1;

    // Transaction safety: Fetch latest inventory item status inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });
      if (!item) throw new Error('Inventory item not found');

      // Derive Event ID safely
      const targetEventId = eventId || item.eventId;
      if (!targetEventId) {
        throw new Error('Event ID is required for allocation');
      }

      // FAULTY ITEM LOCKOUT CHECK
      if (item.isFaulty || /faulty|damaged|red/i.test(item.condition || '')) {
        return {
          isFaultyBlocked: true,
          message: `ALLOCATION BLOCKED: Item [${item.safCode}] "${item.element}" is marked as FAULTY / RED FLAGGED. Faulty items are visible for tracking but CANNOT be added or allocated to any artist or project.`,
          item,
        };
      }

      // Re-calculate real available quantity
      const currentAvailable = item.totalQuantity - item.reservedQuantity - item.allocatedQuantity - item.damagedQuantity - item.maintenanceQuantity;

      if (currentAvailable < reqQty) {
        return {
          insufficient: true,
          requested: reqQty,
          available: Math.max(0, currentAvailable),
          shortage: reqQty - Math.max(0, currentAvailable),
          item,
        };
      }

      // Allocate stock
      const newAllocated = item.allocatedQuantity + reqQty;
      const newAvailable = Math.max(0, item.totalQuantity - item.reservedQuantity - newAllocated - item.damagedQuantity - item.maintenanceQuantity);

      const allocation = await tx.inventoryAllocation.create({
        data: {
          eventId: targetEventId,
          inventoryItemId,
          artistId: artistId || null,
          artworkId: artworkId || null,
          venueId: venueId || null,
          roomId: roomId || null,
          department: department || item.inventoryUsageType,
          requestedQuantity: reqQty,
          approvedQuantity: reqQty,
          issuedQuantity: reqQty,
          status: 'Issued',
          requestedBy: approvedBy || 'Admin User',
          approvedBy: approvedBy || 'Admin User',
          issuedBy: approvedBy || 'Admin User',
          allocationDate: new Date().toISOString().split('T')[0],
          requiredDate: requiredDate || null,
          returnDueDate: returnDueDate || null,
          notes,
        },
      });

      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          allocatedQuantity: newAllocated,
          availableQuantity: newAvailable,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          eventId: targetEventId,
          inventoryItemId,
          movementType: 'Allocated',
          quantity: reqQty,
          previousTotal: item.totalQuantity,
          newTotal: item.totalQuantity,
          previousAvailable: currentAvailable,
          newAvailable,
          performedBy: approvedBy || 'Admin User',
          reason: `Stock Allocated for Artist Installation (Allocation ID: ${allocation.id})`,
          allocationId: allocation.id,
        },
      });

      return { insufficient: false, isFaultyBlocked: false, allocation };
    });

    if (result.isFaultyBlocked) {
      return NextResponse.json({
        success: false,
        isFaultyBlocked: true,
        message: result.message,
        item: result.item,
      }, { status: 400 });
    }

    if (result.insufficient) {
      return NextResponse.json({
        success: false,
        isShortage: true,
        requested: result.requested,
        available: result.available,
        shortage: result.shortage,
        message: `Shortage detected! Requested ${result.requested} units, but only ${result.available} are available (${result.shortage} short). You can allocate ${result.available} and raise a procurement request for ${result.shortage}.`,
        item: result.item,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, allocation: result.allocation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { allocationId, returnedQuantity, damagedQuantity, missingQuantity, returnedBy, notes } = body;

    const retQty = parseInt(returnedQuantity) || 0;
    const damQty = parseInt(damagedQuantity) || 0;
    const missQty = parseInt(missingQuantity) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const alloc = await tx.inventoryAllocation.findUnique({
        where: { id: allocationId },
        include: { inventoryItem: true },
      });

      if (!alloc) throw new Error('Allocation record not found');
      const item = alloc.inventoryItem;

      const newReturned = alloc.returnedQuantity + retQty;
      const newDamaged = alloc.damagedQuantity + damQty;
      const totalReturnedSoFar = newReturned + newDamaged + missQty;
      const newStatus = totalReturnedSoFar >= alloc.issuedQuantity ? 'Returned' : 'Partially Returned';

      await tx.inventoryAllocation.update({
        where: { id: allocationId },
        data: {
          returnedQuantity: newReturned,
          damagedQuantity: newDamaged,
          status: newStatus,
          notes: notes ? `${alloc.notes || ''} | Return note: ${notes}` : alloc.notes,
        },
      });

      const newAllocatedQty = Math.max(0, item.allocatedQuantity - retQty - damQty - missQty);
      const newDamagedQty = item.damagedQuantity + damQty;
      const newAvailableQty = Math.max(
        0,
        item.totalQuantity - item.reservedQuantity - newAllocatedQty - newDamagedQty - item.maintenanceQuantity
      );

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          allocatedQuantity: newAllocatedQty,
          damagedQuantity: newDamagedQty,
          availableQuantity: newAvailableQty,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          eventId: alloc.eventId,
          inventoryItemId: item.id,
          movementType: damQty > 0 ? 'Damaged' : 'Returned',
          quantity: retQty + damQty,
          previousTotal: item.totalQuantity,
          newTotal: item.totalQuantity,
          previousAvailable: item.availableQuantity,
          newAvailable: newAvailableQty,
          performedBy: returnedBy || 'Admin User',
          reason: `Stock Return processed for Allocation ID: ${alloc.id}. Good: ${retQty}, Damaged: ${damQty}, Missing: ${missQty}`,
          allocationId: alloc.id,
        },
      });

      return alloc;
    });

    return NextResponse.json({ success: true, allocation: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Allocation ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const alloc = await tx.inventoryAllocation.findUnique({
        where: { id },
        include: { inventoryItem: true, artist: true },
      });

      if (!alloc) throw new Error('Allocation record not found');
      const item = alloc.inventoryItem;

      // Quantity to restore to pool
      const remainingIssued = Math.max(0, alloc.issuedQuantity - alloc.returnedQuantity - alloc.damagedQuantity);

      // Delete the allocation record
      await tx.inventoryAllocation.delete({ where: { id } });

      // Update inventory item stock
      const newAllocated = Math.max(0, item.allocatedQuantity - remainingIssued);
      const newAvailable = Math.max(
        0,
        item.totalQuantity - item.reservedQuantity - newAllocated - item.damagedQuantity - item.maintenanceQuantity
      );

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          allocatedQuantity: newAllocated,
          availableQuantity: newAvailable,
        },
      });

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          eventId: alloc.eventId,
          inventoryItemId: item.id,
          movementType: 'Unallocated',
          quantity: remainingIssued,
          previousTotal: item.totalQuantity,
          newTotal: item.totalQuantity,
          previousAvailable: item.availableQuantity,
          newAvailable,
          performedBy: 'Admin User',
          reason: `Allocation removed. ${remainingIssued} units returned to available stock pool (Artist: ${alloc.artist?.artistName || 'N/A'}).`,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId: alloc.eventId,
          userName: 'Admin User',
          userRole: 'SUPER ADMIN',
          entityType: 'INVENTORY_ALLOCATION',
          entityId: id,
          action: 'DELETE',
          previousValueJson: JSON.stringify(alloc),
        },
      });

      return { alloc, remainingIssued };
    });

    return NextResponse.json({ success: true, deletedId: id, unallocatedQuantity: result.remainingIssued });
  } catch (error: any) {
    console.error('Error removing allocation:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to remove allocation' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      allocationId,
      targetArtistId,
      targetVenueId,
      targetRoomId,
      targetDepartment,
      newIssuedQuantity,
      reallocatedBy,
      notes,
    } = body;

    if (!allocationId) {
      return NextResponse.json({ success: false, error: 'Allocation ID is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const alloc = await tx.inventoryAllocation.findUnique({
        where: { id: allocationId },
        include: { inventoryItem: true, artist: true },
      });

      if (!alloc) throw new Error('Allocation record not found');
      const item = alloc.inventoryItem;

      let newIssued = alloc.issuedQuantity;
      if (newIssuedQuantity !== undefined && newIssuedQuantity !== null) {
        newIssued = Math.max(1, parseInt(newIssuedQuantity) || 1);
      }

      const diff = newIssued - alloc.issuedQuantity;

      const currentAvailable = item.totalQuantity - item.reservedQuantity - item.allocatedQuantity - item.damagedQuantity - item.maintenanceQuantity;

      if (diff > 0 && currentAvailable < diff) {
        throw new Error(`Insufficient available stock. Requested increase of ${diff}, but only ${currentAvailable} available.`);
      }

      const newAllocated = Math.max(0, item.allocatedQuantity + diff);
      const newAvailable = Math.max(
        0,
        item.totalQuantity - item.reservedQuantity - newAllocated - item.damagedQuantity - item.maintenanceQuantity
      );

      let newArtistName = alloc.artist?.artistName;
      if (targetArtistId && targetArtistId !== alloc.artistId) {
        const targetArtist = await tx.artist.findUnique({ where: { id: targetArtistId } });
        newArtistName = targetArtist?.artistName;
      }

      const updatedAlloc = await tx.inventoryAllocation.update({
        where: { id: allocationId },
        data: {
          artistId: targetArtistId !== undefined ? targetArtistId : alloc.artistId,
          venueId: targetVenueId !== undefined ? targetVenueId : alloc.venueId,
          roomId: targetRoomId !== undefined ? targetRoomId : alloc.roomId,
          department: targetDepartment || alloc.department,
          requestedQuantity: newIssued,
          approvedQuantity: newIssued,
          issuedQuantity: newIssued,
          notes: notes ? `${notes} (Reallocated on ${new Date().toLocaleDateString()})` : alloc.notes,
        },
        include: {
          inventoryItem: true,
          artist: true,
          venue: true,
          room: true,
        },
      });

      if (diff !== 0) {
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            allocatedQuantity: newAllocated,
            availableQuantity: newAvailable,
          },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          eventId: alloc.eventId,
          inventoryItemId: item.id,
          movementType: 'Reallocated',
          quantity: newIssued,
          previousTotal: item.totalQuantity,
          newTotal: item.totalQuantity,
          previousAvailable: currentAvailable,
          newAvailable,
          performedBy: reallocatedBy || 'Admin User',
          reason: `Reallocated stock item to ${newArtistName || 'Target Artist/Location'}. Quantity adjusted: ${alloc.issuedQuantity} -> ${newIssued}.`,
          allocationId: updatedAlloc.id,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId: alloc.eventId,
          userName: reallocatedBy || 'Admin User',
          userRole: 'SUPER ADMIN',
          entityType: 'INVENTORY_ALLOCATION',
          entityId: updatedAlloc.id,
          action: 'REALLOCATE',
          previousValueJson: JSON.stringify(alloc),
          newValueJson: JSON.stringify(updatedAlloc),
        },
      });

      return updatedAlloc;
    });

    return NextResponse.json({ success: true, allocation: result });
  } catch (error: any) {
    console.error('Error reallocating item:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to reallocate item' }, { status: 500 });
  }
}
