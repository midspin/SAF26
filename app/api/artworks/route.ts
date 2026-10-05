import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      techProdLayout,
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
        techProdLayout,
        notes,
      },
    });

    if (techProdLayout) {
      try {
        const addedByName = body.userName || body.createdByName || body.addedBy || (body.userRole ? `${body.userRole} Member` : 'Spatial Designer');
        await prisma.notification.create({
          data: {
            eventId: eventId || artwork.eventId,
            title: '📐 Spatial Drawing Uploaded',
            message: `Spatial layout drawing for artwork "${artwork.artworkName}" was uploaded by ${addedByName}.`,
            addedBy: addedByName,
            type: 'info',
            targetRoles: 'PRODUCTION & LAYOUT,PROGRAMMING',
            link: artwork.artistId ? `/artists/${artwork.artistId}` : '/artworks',
          },
        });
      } catch (notifErr) {
        console.error('Failed to create artwork drawing notification:', notifErr);
      }
    }

    return NextResponse.json({ success: true, artwork });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
