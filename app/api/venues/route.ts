import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFromCache, setToCache, invalidateCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const cacheKey = `all_venues_${eventId || 'all'}`;
    const cached = getFromCache<any>(cacheKey, 300000); // 5 minutes
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

    const where: any = {};
    if (eventId) where.eventId = eventId;

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { venueName: 'asc' },
      include: {
        rooms: {
          orderBy: { roomNumber: 'asc' },
          include: {
            installations: {
              select: {
                id: true,
                artistId: true,
                artworkId: true,
                installationStatus: true,
                artist: {
                  select: {
                    id: true,
                    artistName: true,
                  },
                },
                artwork: {
                  select: {
                    id: true,
                    artworkName: true,
                  },
                },
              },
            },
          },
        },
        installations: true,
      },
    });

    const responseData = { success: true, venues };
    setToCache(cacheKey, responseData);

    return NextResponse.json(
      responseData,
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      venueName,
      mainVenueImage,
      venueDocument,
      venueDocumentType,
      address,
      contactName,
      contactPhone,
      contactEmail,
      description,
      openingHours,
      accessInfo,
      loadingInfo,
      parkingInfo,
      powerInfo,
      internetInfo,
      technicalNotes,
      productionNotes,
    } = body;

    const venue = await prisma.venue.create({
      data: {
        eventId,
        venueName,
        mainVenueImage,
        venueDocument,
        venueDocumentType,
        address,
        contactName,
        contactPhone,
        contactEmail,
        description,
        openingHours,
        accessInfo,
        loadingInfo,
        parkingInfo,
        powerInfo,
        internetInfo,
        technicalNotes,
        productionNotes,
      },
    });

    if (eventId) {
      await prisma.auditLog.create({
        data: {
          eventId,
          userName: body.userName || 'Admin User',
          userRole: body.userRole || 'SUPER ADMIN',
          entityType: 'VENUE',
          entityId: venue.id,
          action: 'CREATE',
          newValueJson: JSON.stringify(venue),
        },
      });
    }

    invalidateCache('venue');
    return NextResponse.json({ success: true, venue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
