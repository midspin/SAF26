import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { year: 'desc' },
      include: {
        _count: {
          select: {
            artists: true,
            artworks: true,
            venues: true,
            inventoryItems: true,
          },
        },
      },
    });
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      code,
      year,
      description,
      startDate,
      endDate,
      status,
      logo,
      coverPage,
      location,
      address,
      email,
      contact,
    } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Event name and code are required.' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        code,
        year: parseInt(year) || new Date().getFullYear(),
        description: description || null,
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || 'Active',
        logo: logo || null,
        coverPage: coverPage || null,
        location: location || null,
        address: address || null,
        email: email || null,
        contact: contact || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: event.id,
        userName: 'Super Admin',
        userRole: 'SUPER ADMIN',
        entityType: 'EVENT',
        entityId: event.id,
        action: 'CREATE',
        newValueJson: JSON.stringify(event),
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
