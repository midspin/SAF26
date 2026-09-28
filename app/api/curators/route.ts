import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    let curators: any[] = [];
    if (eventId) {
      curators = await prisma.curator.findMany({
        where: { eventId },
        orderBy: { name: 'asc' },
        include: {
          artistAssignments: {
            include: { artist: true },
          },
        },
      });
    }

    if (!eventId || curators.length === 0) {
      curators = await prisma.curator.findMany({
        orderBy: { name: 'asc' },
        include: {
          artistAssignments: {
            include: { artist: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, curators });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, name, category, photo, profile, organisation, email, phone, website, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Curator name is required.' }, { status: 400 });
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

    const curator = await prisma.curator.create({
      data: {
        eventId: targetEventId,
        name: name.trim(),
        category: category || null,
        photo: photo || null,
        profile: profile || null,
        organisation: organisation || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        notes: notes || null,
      },
      include: {
        artistAssignments: {
          include: { artist: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: targetEventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'CURATOR',
        entityId: curator.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(curator),
      },
    });

    return NextResponse.json({ success: true, curator });
  } catch (error: any) {
    console.error('Error creating curator:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create curator' }, { status: 500 });
  }
}
