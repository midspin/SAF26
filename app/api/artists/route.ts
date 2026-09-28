import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        artworks: true,
        curatorAssignments: { include: { curator: true } },
        pocAssignments: { include: { poc: true } },
        programmingAssignments: { include: { programmingPerson: true } },
        installations: {
          include: {
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
      artistName,
      artistPhoto,
      biography,
      country,
      city,
      email,
      phone,
      website,
      notes,
      status,
      curatorIds = [],
      pocIds = [],
      programmingIds = [],
    } = body;

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

    await prisma.auditLog.create({
      data: {
        eventId: targetEventId,
        userName: body.userName || 'Admin User',
        userRole: body.userRole || 'SUPER ADMIN',
        entityType: 'ARTIST',
        entityId: artist.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(artist),
      },
    });

    // Notification trigger for recipient roles: Technical head, Production & layout, Inventory manager, Procurement manager
    const creatorRoleNorm = (body.userRole || 'SUPER ADMIN').trim().toUpperCase();
    const allowedCreators = [
      'SUPER ADMIN',
      'SUPERADMIN',
      'PROGRAMMING',
      'PROGRAMMER',
      'PROGRAMMERS',
      'PROGRAMMING TEAM',
      'PRODUCTION & LAYOUT',
      'PRODUCTION AND LAYOUT',
      'PRODUCTION & LAYOUT TEAM',
    ];

    if (allowedCreators.includes(creatorRoleNorm)) {
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

    return NextResponse.json({ success: true, artist });
  } catch (error: any) {
    console.error('Error creating artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create artist.' }, { status: 500 });
  }
}
