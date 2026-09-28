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

    const installations = await prisma.artistInstallation.findMany({
      where,
      include: {
        artist: true,
        artwork: true,
        venue: true,
        room: true,
      },
    });

    return NextResponse.json({ success: true, installations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, artistId, artworkId, venueId, roomId, roomIds, installationNotes, installationStatus, startDate, endDate } = body;

    // Determine target rooms array (deduplicated)
    const rawRooms = Array.isArray(roomIds) && roomIds.length > 0 ? roomIds : roomId ? [roomId] : [];
    const targetRoomIds: string[] = Array.from(new Set(rawRooms));

    if (artistId && venueId) {
      // Enforce 1 Venue per Artist: Delete existing installations if venue changed or to sync room assignments
      await prisma.artistInstallation.deleteMany({
        where: { artistId },
      });

      if (targetRoomIds.length > 0) {
        const createdInstallations = [];
        for (const rId of targetRoomIds) {
          const inst = await prisma.artistInstallation.create({
            data: {
              eventId,
              artistId,
              artworkId: artworkId || null,
              venueId,
              roomId: rId,
              installationNotes,
              installationStatus: installationStatus || 'Planned',
              startDate,
              endDate,
            },
          });
          createdInstallations.push(inst);
        }
        return NextResponse.json({ success: true, installations: createdInstallations });
      } else {
        // Create 1 general venue installation without specific room
        const installation = await prisma.artistInstallation.create({
          data: {
            eventId,
            artistId,
            artworkId: artworkId || null,
            venueId,
            roomId: null,
            installationNotes,
            installationStatus: installationStatus || 'Planned',
            startDate,
            endDate,
          },
        });
        return NextResponse.json({ success: true, installation });
      }
    }

    const installation = await prisma.artistInstallation.create({
      data: {
        eventId,
        artistId,
        artworkId,
        venueId,
        roomId: targetRoomIds[0] || null,
        installationNotes,
        installationStatus: installationStatus || 'Planned',
        startDate,
        endDate,
      },
    });

    return NextResponse.json({ success: true, installation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, installationStatus, installationNotes, venueId, roomId, startDate, endDate } = body;

    const installation = await prisma.artistInstallation.update({
      where: { id },
      data: {
        installationStatus,
        installationNotes,
        venueId,
        roomId,
        startDate,
        endDate,
      },
    });

    return NextResponse.json({ success: true, installation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
