import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        code: code !== undefined ? code : existing.code,
        year: year !== undefined ? parseInt(year) || existing.year : existing.year,
        description: description !== undefined ? description : existing.description,
        startDate: startDate !== undefined ? startDate : existing.startDate,
        endDate: endDate !== undefined ? endDate : existing.endDate,
        status: status !== undefined ? status : existing.status,
        logo: logo !== undefined ? logo : existing.logo,
        coverPage: coverPage !== undefined ? coverPage : existing.coverPage,
        location: location !== undefined ? location : existing.location,
        address: address !== undefined ? address : existing.address,
        email: email !== undefined ? email : existing.email,
        contact: contact !== undefined ? contact : existing.contact,
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: updatedEvent.id,
        userName: 'Super Admin',
        userRole: 'SUPER ADMIN',
        entityType: 'EVENT',
        entityId: updatedEvent.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updatedEvent),
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: id,
        userName: 'Super Admin',
        userRole: 'SUPER ADMIN',
        entityType: 'EVENT',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
