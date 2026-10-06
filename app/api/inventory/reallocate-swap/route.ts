import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      allocationId,
      replacementInventoryItemId,
      replacementQuantity,
      requesterName,
      requesterRole,
      reason,
      notes,
    } = body;

    if (!allocationId) {
      return NextResponse.json({ success: false, error: 'Allocation ID is required' }, { status: 400 });
    }

    if (!replacementInventoryItemId) {
      return NextResponse.json({ success: false, error: 'Replacement inventory item is required' }, { status: 400 });
    }

    // Fetch existing allocation
    const existingAlloc = await prisma.inventoryAllocation.findUnique({
      where: { id: allocationId },
      include: {
        inventoryItem: true,
        artist: true,
        artwork: true,
        venue: true,
        room: true,
      },
    });

    if (!existingAlloc) {
      return NextResponse.json({ success: false, error: 'Allocation not found' }, { status: 404 });
    }

    // Fetch replacement item
    const newItem = await prisma.inventoryItem.findUnique({
      where: { id: replacementInventoryItemId },
    });

    if (!newItem) {
      return NextResponse.json({ success: false, error: 'Replacement inventory item not found' }, { status: 404 });
    }

    // Check if new item is faulty
    if (newItem.isFaulty || /faulty|damaged|red/i.test(newItem.condition || '')) {
      return NextResponse.json({
        success: false,
        error: `Cannot swap with [${newItem.safCode}] "${newItem.element}" because it is marked as FAULTY.`,
      }, { status: 400 });
    }

    const swapQty = Math.max(1, parseInt(replacementQuantity) || existingAlloc.issuedQuantity || 1);
    const newAvailable = newItem.totalQuantity - newItem.reservedQuantity - newItem.allocatedQuantity - newItem.damagedQuantity - newItem.maintenanceQuantity;

    if (newAvailable < swapQty) {
      return NextResponse.json({
        success: false,
        error: `Insufficient stock for replacement item "${newItem.element}". Requested: ${swapQty}, Available: ${Math.max(0, newAvailable)}`,
      }, { status: 400 });
    }

    const oldItemName = `${existingAlloc.inventoryItem.element} (${existingAlloc.inventoryItem.safCode})`;
    const newItemName = `${newItem.element} (${newItem.safCode})`;
    const artistName = existingAlloc.artist?.artistName || 'Artist Project';

    // Encode swap metadata into the notification link / payload
    const swapPayload = {
      type: 'REALLOCATION_SWAP',
      allocationId: existingAlloc.id,
      oldInventoryItemId: existingAlloc.inventoryItemId,
      newInventoryItemId: newItem.id,
      swapQuantity: swapQty,
      artistId: existingAlloc.artistId,
      artworkId: existingAlloc.artworkId,
      venueId: existingAlloc.venueId,
      roomId: existingAlloc.roomId,
      department: existingAlloc.department,
      requesterName: requesterName || 'Team Member',
      requesterRole: requesterRole || 'Staff',
      reason: reason || notes || 'Equipment replacement / reallocation requested.',
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    const notification = await prisma.notification.create({
      data: {
        eventId: existingAlloc.eventId,
        title: `🔄 Reallocation Swap Request: ${artistName}`,
        message: `${requesterName || 'Team'} (${requesterRole || 'Staff'}) requested to swap "${oldItemName}" with "${newItemName}" (Qty: ${swapQty}) for ${artistName}. Reason: ${reason || 'Equipment adjustment'}. Click Approve below to apply.`,
        addedBy: requesterName || 'Reallocation Engine',
        type: 'warning',
        targetRoles: 'SUPER ADMIN,SUPERADMIN,INVENTORY TEAM,INVENTORY MANAGER,INVENTORY HEAD,INVENTORY',
        link: `/inventory?swapApproval=${encodeURIComponent(JSON.stringify(swapPayload))}`,
      },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          eventId: existingAlloc.eventId,
          userName: requesterName || 'System User',
          userRole: requesterRole || 'STAFF',
          entityType: 'INVENTORY_REALLOCATION_REQUEST',
          entityId: existingAlloc.id,
          action: 'REQUEST_SWAP',
          newValueJson: JSON.stringify(swapPayload),
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Swap request submitted! Inventory team has been notified to approve swapping "${oldItemName}" with "${newItemName}".`,
      swapPayload,
      notificationId: notification.id,
    });
  } catch (error: any) {
    console.error('Error in reallocate-swap request:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create swap request' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { action, swapPayload, approvedBy, approverRole } = body;

    if (!swapPayload || !swapPayload.allocationId || !swapPayload.newInventoryItemId) {
      return NextResponse.json({ success: false, error: 'Valid swap payload is required' }, { status: 400 });
    }

    if (action === 'REJECT') {
      // Create rejection notification
      await prisma.notification.create({
        data: {
          eventId: swapPayload.eventId || null,
          title: `❌ Reallocation Swap Rejected`,
          message: `Swap request for allocation (${swapPayload.allocationId}) was rejected by ${approvedBy || 'Inventory Head'} (${approverRole || 'INVENTORY'}).`,
          addedBy: approvedBy || 'Inventory Manager',
          type: 'error',
          targetRoles: 'SUPER ADMIN,TECHNICAL TEAM,PRODUCTION TEAM',
        },
      });

      return NextResponse.json({ success: true, message: 'Swap request rejected.' });
    }

    // Execute atomic swap
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch current allocation
        const currentAlloc = await tx.inventoryAllocation.findUnique({
          where: { id: swapPayload.allocationId },
          include: { inventoryItem: true, artist: true },
        });

        if (!currentAlloc) throw new Error('Original allocation record not found');
        const oldItem = currentAlloc.inventoryItem;

        // 2. Fetch replacement item
        const newItem = await tx.inventoryItem.findUnique({
          where: { id: swapPayload.newInventoryItemId },
        });

        if (!newItem) throw new Error('Replacement inventory item not found in stock');

        const swapQty = Math.max(1, parseInt(swapPayload.swapQuantity) || currentAlloc.issuedQuantity);

        // Check availability of new item
        const newAvailable = newItem.totalQuantity - newItem.reservedQuantity - newItem.allocatedQuantity - newItem.damagedQuantity - newItem.maintenanceQuantity;
        if (newAvailable < swapQty) {
          throw new Error(`Insufficient stock for replacement item "${newItem.element}". Only ${Math.max(0, newAvailable)} available.`);
        }

        // 3. Restore Old Item Stock
        const oldNewAllocated = Math.max(0, oldItem.allocatedQuantity - currentAlloc.issuedQuantity);
        const oldNewAvailable = Math.max(
          0,
          oldItem.totalQuantity - oldItem.reservedQuantity - oldNewAllocated - oldItem.damagedQuantity - oldItem.maintenanceQuantity
        );

        await tx.inventoryItem.update({
          where: { id: oldItem.id },
          data: {
            allocatedQuantity: oldNewAllocated,
            availableQuantity: oldNewAvailable,
          },
        });

        // 4. Allocate New Item Stock
        const newItemNewAllocated = newItem.allocatedQuantity + swapQty;
        const newItemNewAvailable = Math.max(
          0,
          newItem.totalQuantity - newItem.reservedQuantity - newItemNewAllocated - newItem.damagedQuantity - newItem.maintenanceQuantity
        );

        await tx.inventoryItem.update({
          where: { id: newItem.id },
          data: {
            allocatedQuantity: newItemNewAllocated,
            availableQuantity: newItemNewAvailable,
          },
        });

        // 5. Update Allocation Record to point to new item
        const updatedAlloc = await tx.inventoryAllocation.update({
          where: { id: currentAlloc.id },
          data: {
            inventoryItemId: newItem.id,
            requestedQuantity: swapQty,
            approvedQuantity: swapQty,
            issuedQuantity: swapQty,
            notes: `${currentAlloc.notes || ''} | Swapped from [${oldItem.safCode}] ${oldItem.element} on ${new Date().toLocaleDateString()} (Approved by: ${approvedBy || 'Inventory Team'})`,
          },
          include: {
            inventoryItem: true,
            artist: true,
            venue: true,
            room: true,
          },
        });

        // 6. Record Movements
        await tx.inventoryMovement.create({
          data: {
            eventId: currentAlloc.eventId,
            inventoryItemId: oldItem.id,
            movementType: 'Unallocated',
            quantity: currentAlloc.issuedQuantity,
            previousTotal: oldItem.totalQuantity,
            newTotal: oldItem.totalQuantity,
            previousAvailable: oldItem.availableQuantity,
            newAvailable: oldNewAvailable,
            performedBy: approvedBy || 'Inventory Manager',
            reason: `Item swapped out for Artist ${currentAlloc.artist?.artistName || 'N/A'}. Returned to pool.`,
            allocationId: currentAlloc.id,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            eventId: currentAlloc.eventId,
            inventoryItemId: newItem.id,
            movementType: 'Allocated',
            quantity: swapQty,
            previousTotal: newItem.totalQuantity,
            newTotal: newItem.totalQuantity,
            previousAvailable: newItem.availableQuantity,
            newAvailable: newItemNewAvailable,
            performedBy: approvedBy || 'Inventory Manager',
            reason: `Item swapped in for Artist ${currentAlloc.artist?.artistName || 'N/A'} (Replaced ${oldItem.element}).`,
            allocationId: updatedAlloc.id,
          },
        });

        return { updatedAlloc, oldItem, newItem, currentAlloc };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Send confirmation notification to teams
    try {
      await prisma.notification.create({
        data: {
          eventId: result.currentAlloc.eventId,
          title: `✅ Item Swap Approved: ${result.currentAlloc.artist?.artistName || 'Artist'}`,
          message: `Swap Approved by ${approvedBy || 'Inventory'}: "${result.oldItem.element}" was returned to stock and "${result.newItem.element}" is now allocated to ${result.currentAlloc.artist?.artistName || 'Artist'}.`,
          addedBy: approvedBy || 'Inventory Head',
          type: 'success',
          targetRoles: 'SUPER ADMIN,TECHNICAL TEAM,PRODUCTION TEAM,INVENTORY TEAM',
          link: `/artists/${result.currentAlloc.artistId}`,
        },
      });

      await prisma.auditLog.create({
        data: {
          eventId: result.currentAlloc.eventId,
          userName: approvedBy || 'Inventory Manager',
          userRole: approverRole || 'INVENTORY',
          entityType: 'INVENTORY_ALLOCATION',
          entityId: result.updatedAlloc.id,
          action: 'SWAP_APPROVED',
          previousValueJson: JSON.stringify(result.currentAlloc),
          newValueJson: JSON.stringify(result.updatedAlloc),
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Equipment swap approved and executed successfully!`,
      allocation: result.updatedAlloc,
    });
  } catch (error: any) {
    console.error('Error approving swap:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to approve swap' }, { status: 500 });
  }
}
