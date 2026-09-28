import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const eventId = searchParams.get('eventId');

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, results: { artists: [], artworks: [], inventory: [], venues: [], procurement: [] } });
    }

    const eventWhere = eventId ? { eventId } : {};

    const artists = await prisma.artist.findMany({
      where: {
        ...eventWhere,
        OR: [
          { artistName: { contains: q } },
          { biography: { contains: q } },
          { email: { contains: q } },
          { country: { contains: q } },
        ],
      },
      take: 5,
    });

    const artworks = await prisma.artwork.findMany({
      where: {
        ...eventWhere,
        OR: [
          { artworkName: { contains: q } },
          { medium: { contains: q } },
        ],
      },
      take: 5,
      include: { artist: true },
    });

    const inventory = await prisma.inventoryItem.findMany({
      where: {
        ...eventWhere,
        OR: [
          { safCode: { contains: q } },
          { element: { contains: q } },
          { model: { contains: q } },
          { serialNo: { contains: q } },
          { location: { contains: q } },
          { brandProject: { contains: q } },
        ],
      },
      take: 8,
    });

    const venues = await prisma.venue.findMany({
      where: {
        ...eventWhere,
        OR: [
          { venueName: { contains: q } },
          { address: { contains: q } },
        ],
      },
      take: 5,
      include: { rooms: true },
    });

    const purchases = await prisma.purchaseRequest.findMany({
      where: {
        ...eventWhere,
        OR: [
          { itemName: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      query: q,
      results: {
        artists,
        artworks,
        inventory,
        venues,
        procurement: purchases,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
