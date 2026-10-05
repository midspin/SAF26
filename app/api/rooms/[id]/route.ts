import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        venue: true,
        installations: {
          include: {
            artist: true,
            artwork: true,
          },
        },
        allocations: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    const {
      venueId,
      roomNumber,
      roomName,
      floor,
      area,
      length,
      width,
      height,
      capacity,
      roomImage,
      roomImagesJson,
      floorplan,
      elevation,
      techProdLayout,
      powerInfo,
      internetInfo,
      lightingInfo,
      existingEquipment,
      accessInfo,
      restrictions,
      notes,
      userRole = 'SUPER ADMIN',
      userName = 'Admin User',
    } = body;

    if (!roomNumber || !roomName) {
      return NextResponse.json(
        { success: false, error: 'Room Number and Room Name are required' },
        { status: 400 }
      );
    }

    const mainImage = techProdLayout || roomImage || existing.roomImage || null;

    const room = await prisma.room.update({
      where: { id },
      data: {
        venueId: venueId || existing.venueId,
        roomNumber: roomNumber.trim(),
        roomName: roomName.trim(),
        floor: floor || null,
        area: area || null,
        length: length || null,
        width: width || null,
        height: height || null,
        capacity: capacity || null,
        roomImage: mainImage,
        roomImagesJson: roomImagesJson || null,
        floorplan: floorplan || null,
        elevation: elevation || null,
        techProdLayout: techProdLayout || existing.techProdLayout || null,
        powerInfo: powerInfo || null,
        internetInfo: internetInfo || null,
        lightingInfo: lightingInfo || null,
        existingEquipment: existingEquipment || null,
        accessInfo: accessInfo || null,
        restrictions: restrictions || null,
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName,
        userRole,
        entityType: 'ROOM',
        entityId: room.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(room),
      },
    });

    if (floorplan || elevation || techProdLayout) {
      try {
        const addedByName = userName || (userRole ? `${userRole} Member` : 'Spatial Designer');
        await prisma.notification.create({
          data: {
            eventId: room.eventId,
            title: '📐 Spatial Drawing Uploaded',
            message: `Spatial drawing for Room "${room.roomName} (${room.roomNumber})" was updated/uploaded by ${addedByName}.`,
            addedBy: addedByName,
            type: 'info',
            targetRoles: 'PRODUCTION & LAYOUT,PROGRAMMING',
            link: '/rooms',
          },
        });
      } catch (notifErr) {
        console.error('Failed to create room drawing notification:', notifErr);
      }
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    await prisma.room.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'ROOM',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete room' }, { status: 500 });
  }
}
