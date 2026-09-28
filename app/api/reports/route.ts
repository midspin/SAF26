import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const reportType = searchParams.get('type') || 'INVENTORY';

    const where: any = {};
    if (eventId) where.eventId = eventId;

    let data: any = [];

    if (reportType === 'ARTIST') {
      data = await prisma.artist.findMany({
        where,
        include: {
          artworks: true,
          curatorAssignments: { include: { curator: true } },
          installations: { include: { venue: true, room: true } },
        },
      });
    } else if (reportType === 'INVENTORY') {
      data = await prisma.inventoryItem.findMany({
        where,
        orderBy: { safCode: 'asc' },
        include: { vendor: true },
      });
    } else if (reportType === 'TECHNICAL_ALLOCATION') {
      data = await prisma.inventoryAllocation.findMany({
        where: { ...where, department: 'TECHNICAL' },
        include: { inventoryItem: true, artist: true, artwork: true, venue: true, room: true },
      });
    } else if (reportType === 'PRODUCTION_ALLOCATION') {
      data = await prisma.inventoryAllocation.findMany({
        where: { ...where, department: 'PRODUCTION' },
        include: { inventoryItem: true, artist: true, artwork: true, venue: true, room: true },
      });
    } else if (reportType === 'PURCHASE') {
      data = await prisma.purchaseRequest.findMany({
        where,
        include: { artist: true, artwork: true, vendor: true },
      });
    } else if (reportType === 'RENTAL') {
      data = await prisma.rentalRecord.findMany({
        where,
        include: { artist: true, artwork: true, vendor: true },
      });
    } else if (reportType === 'MOVEMENT') {
      data = await prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { inventoryItem: true },
      });
    } else {
      data = await prisma.inventoryItem.findMany({ where });
    }

    return NextResponse.json({ success: true, reportType, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
