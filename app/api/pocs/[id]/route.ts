import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const poc = await prisma.poc.findUnique({
      where: { id },
      include: {
        artistAssignments: {
          include: { artist: true },
        },
      },
    });

    if (!poc) {
      return NextResponse.json({ success: false, error: 'POC not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, poc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.poc.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'POC not found' }, { status: 404 });
    }

    const { name, photo, organisation, role, email, phone, whatsapp, altPhone, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'POC name is required.' }, { status: 400 });
    }

    const poc = await prisma.poc.update({
      where: { id },
      data: {
        name: name.trim(),
        photo: photo || null,
        organisation: organisation || null,
        role: role || null,
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
        eventId: poc.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'POC',
        entityId: poc.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(poc),
      },
    });

    return NextResponse.json({ success: true, poc });
  } catch (error: any) {
    console.error('Error updating POC:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update POC' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.poc.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'POC not found' }, { status: 404 });
    }

    await prisma.poc.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'POC',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting POC:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete POC' }, { status: 500 });
  }
}
