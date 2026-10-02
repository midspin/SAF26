import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    let pocs: any[] = [];
    if (eventId) {
      pocs = await prisma.poc.findMany({
        where: { eventId },
        orderBy: { name: 'asc' },
        include: {
          artistAssignments: {
            include: { artist: true },
          },
        },
      });
    }

    if (!eventId || pocs.length === 0) {
      pocs = await prisma.poc.findMany({
        orderBy: { name: 'asc' },
        include: {
          artistAssignments: {
            include: { artist: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, pocs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, name, photo, organisation, role, email, phone, whatsapp, altPhone, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'POC Name is required.' }, { status: 400 });
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

    const poc = await prisma.poc.create({
      data: {
        eventId: targetEventId,
        name: name.trim(),
        photo: photo || null,
        organisation: organisation || null,
        role: role || 'Studio Manager',
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        altPhone: altPhone || null,
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
        entityType: 'POC',
        entityId: poc.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(poc),
      },
    });

    return NextResponse.json({ success: true, poc });
  } catch (error: any) {
    console.error('Error creating POC:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create POC' }, { status: 500 });
  }
}
