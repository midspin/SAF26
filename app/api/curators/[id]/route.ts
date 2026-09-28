import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const curator = await prisma.curator.findUnique({
      where: { id },
      include: {
        artistAssignments: {
          include: { artist: true },
        },
      },
    });

    if (!curator) {
      return NextResponse.json({ success: false, error: 'Curator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, curator });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.curator.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Curator not found' }, { status: 404 });
    }

    const { name, category, photo, profile, organisation, email, phone, website, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Curator name is required.' }, { status: 400 });
    }

    const curator = await prisma.curator.update({
      where: { id },
      data: {
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
        eventId: curator.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'CURATOR',
        entityId: curator.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(curator),
      },
    });

    return NextResponse.json({ success: true, curator });
  } catch (error: any) {
    console.error('Error updating curator:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update curator' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.curator.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Curator not found' }, { status: 404 });
    }

    await prisma.curator.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'CURATOR',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting curator:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete curator' }, { status: 500 });
  }
}
