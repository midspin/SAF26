import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const venueId = searchParams.get('venueId');

    const where: any = {};
    if (venueId) where.venueId = venueId;

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
      include: {
        venue: true,
        installations: {
          include: {
            artist: true,
            artwork: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
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
    } = body;

    const mainImage = techProdLayout || roomImage || null;

    const room = await prisma.room.create({
      data: {
        eventId,
        venueId,
        roomNumber,
        roomName,
        floor,
        area,
        length,
        width,
        height,
        capacity,
        roomImage: mainImage,
        roomImagesJson,
        floorplan,
        elevation,
        techProdLayout: techProdLayout || null,
        powerInfo,
        internetInfo,
        lightingInfo,
        existingEquipment,
        accessInfo,
        restrictions,
        notes,
      },
    });

    if (eventId) {
      await prisma.auditLog.create({
        data: {
          eventId,
          userName: body.userName || 'Admin User',
          userRole: body.userRole || 'SUPER ADMIN',
          entityType: 'ROOM',
          entityId: room.id,
          action: 'CREATE',
          newValueJson: JSON.stringify(room),
        },
      });
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
