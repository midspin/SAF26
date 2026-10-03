import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_MUTATION_ROLES = [
  'SUPER ADMIN',
  'SUPERADMIN',
  'ADMIN',
  'PROGRAMMING',
  'PROGRAMMER',
  'PROGRAMMERS',
  'PROGRAMMING TEAM',
  'PROGRAMMING HEAD',
];

function isAuthorized(role?: string): boolean {
  if (!role) return true;
  return ALLOWED_MUTATION_ROLES.includes(role.trim().toUpperCase());
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const where: any = {};
    if (eventId) where.eventId = eventId;

    const artists = await prisma.artist.findMany({
      where,
      orderBy: { artistName: 'asc' },
      include: {
        artworks: {
          include: {
            venue: true,
            room: true,
          },
        },
        curatorAssignments: { include: { curator: true } },
        pocAssignments: { include: { poc: true } },
        programmingAssignments: { include: { programmingPerson: true } },
        installations: {
          include: {
            artwork: true,
            venue: true,
            room: true,
          },
        },
        _count: {
          select: {
            technicalRequirements: true,
            productionRequirements: true,
            allocations: true,
            purchaseRequests: true,
            rentalRecords: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, artists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventId,
      userRole,
      artistName,
      artistPhoto,
      biography,
      country,
      city,
      email,
      phone,
      website,
      notes,
      arrivalDate,
      departureDate,
      travelNotes,
      lodgingDetails,
      status,
      curatorIds = [],
      pocIds = [],
      programmingIds = [],
      artworks = [],
    } = body;

    // Enforce role restriction for Super Admin & Programming Team
    if (userRole && !isAuthorized(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only Super Admin and Programming Team can create artists.' },
        { status: 403 }
      );
    }

    if (!artistName || !artistName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Artist Name is required.' },
        { status: 400 }
      );
    }

    let targetEventId = eventId;
    if (!targetEventId) {
      const activeEvent =
        (await prisma.event.findFirst({ where: { status: 'Active' } })) ||
        (await prisma.event.findFirst());
      targetEventId = activeEvent?.id;
    }

    if (!targetEventId) {
      return NextResponse.json(
        { success: false, error: 'No active event found. Please create an event first.' },
        { status: 400 }
      );
    }

    const safeCuratorIds = Array.isArray(curatorIds) ? curatorIds : [];
    const safePocIds = Array.isArray(pocIds) ? pocIds : [];
    const safeProgrammingIds = Array.isArray(programmingIds) ? programmingIds : [];

    // Create Artist record with Travel & Lodging fields
    const artist = await prisma.artist.create({
      data: {
        eventId: targetEventId,
        artistName: artistName.trim(),
        artistPhoto: artistPhoto || null,
        biography: biography || null,
        country: country || null,
        city: city || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        notes: notes || null,
        arrivalDate: arrivalDate || null,
        departureDate: departureDate || null,
        travelNotes: travelNotes || null,
        lodgingDetails: lodgingDetails || null,
        status: status || 'Confirmed',
        curatorAssignments: {
          create: safeCuratorIds.map((cId: string) => ({ curatorId: cId })),
        },
        pocAssignments: {
          create: safePocIds.map((pId: string) => ({ pocId: pId })),
        },
        programmingAssignments: {
          create: safeProgrammingIds.map((prId: string) => ({ programmingPersonId: prId })),
        },
      },
    });

    // Create Artworks & Installations if provided
    if (Array.isArray(artworks) && artworks.length > 0) {
      for (const item of artworks) {
        if (!item.artworkName || !item.artworkName.trim()) continue;

        const createdArtwork = await prisma.artwork.create({
          data: {
            eventId: targetEventId,
            artistId: artist.id,
            artworkName: item.artworkName.trim(),
            medium: item.medium || null,
            dimensions: item.dimensions || null,
            installationType: item.installationType || null,
            notes: item.notes || item.description || null,
            venueId: item.venueId || null,
            roomId: item.roomId || null,
          },
        });

        // If venue or room is assigned, create/sync installation record
        if (item.venueId || item.roomId) {
          await prisma.artistInstallation.create({
            data: {
              eventId: targetEventId,
              artistId: artist.id,
              artworkId: createdArtwork.id,
              venueId: item.venueId || null,
              roomId: item.roomId || null,
              installationStatus: 'Planned',
            },
          });
        }
      }
    }

    // Fetch full created artist object including relations
    const fullArtist = await prisma.artist.findUnique({
      where: { id: artist.id },
      include: {
        artworks: { include: { venue: true, room: true } },
        curatorAssignments: { include: { curator: true } },
        pocAssignments: { include: { poc: true } },
        programmingAssignments: { include: { programmingPerson: true } },
        installations: { include: { venue: true, room: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: targetEventId,
        userName: body.userName || 'Admin User',
        userRole: body.userRole || 'SUPER ADMIN',
        entityType: 'ARTIST',
        entityId: artist.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(fullArtist),
      },
    });

    // Notification trigger
    const creatorRoleNorm = (body.userRole || 'SUPER ADMIN').trim().toUpperCase();
    if (isAuthorized(creatorRoleNorm)) {
      try {
        await prisma.notification.create({
          data: {
            eventId: targetEventId,
            title: '🎨 New Artist Registered',
            message: `Artist "${artist.artistName}" was added by ${body.userRole || 'Super Admin'}.`,
            type: 'info',
            targetRoles: 'TECHNICAL HEAD,PRODUCTION & LAYOUT,INVENTORY MANAGER,PROCUREMENT MANAGER',
            link: `/artists/${artist.id}`,
          },
        });
      } catch (notifErr) {
        console.error('Failed to create artist notification:', notifErr);
      }
    }

    return NextResponse.json({ success: true, artist: fullArtist });
  } catch (error: any) {
    console.error('Error creating artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create artist.' }, { status: 500 });
  }
}
