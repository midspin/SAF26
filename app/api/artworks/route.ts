import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const artistId = searchParams.get('artistId');

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (artistId) where.artistId = artistId;

    const artworks = await prisma.artwork.findMany({
      where,
      orderBy: { artworkName: 'asc' },
      include: {
        artist: true,
        installations: {
          include: {
            venue: true,
            room: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, artworks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      artistId,
      artworkName,
      description,
      images,
      dimensions,
      weight,
      medium,
      installationType,
      notes,
    } = body;

    const artwork = await prisma.artwork.create({
      data: {
        eventId,
        artistId,
        artworkName,
        description,
        images,
        dimensions,
        weight,
        medium,
        installationType: installationType || 'Projection',
        notes,
      },
    });

    return NextResponse.json({ success: true, artwork });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
