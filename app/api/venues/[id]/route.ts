import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            installations: {
              include: {
                artist: true,
                artwork: true,
              },
            },
            allocations: {
              include: {
                inventoryItem: true,
              },
            },
          },
        },
        installations: true,
      },
    });

    if (!venue) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, venue });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 });
    }

    const {
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
      userRole = 'SUPER ADMIN',
      userName = 'Admin User',
    } = body;

    if (!venueName || !venueName.trim()) {
      return NextResponse.json({ success: false, error: 'Venue Name is required' }, { status: 400 });
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: {
        venueName: venueName.trim(),
        mainVenueImage: mainVenueImage || null,
        venueDocument: venueDocument || null,
        venueDocumentType: venueDocumentType || null,
        address: address || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        description: description || null,
        openingHours: openingHours || null,
        accessInfo: accessInfo || null,
        loadingInfo: loadingInfo || null,
        parkingInfo: parkingInfo || null,
        powerInfo: powerInfo || null,
        internetInfo: internetInfo || null,
        technicalNotes: technicalNotes || null,
        productionNotes: productionNotes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName,
        userRole,
        entityType: 'VENUE',
        entityId: venue.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(venue),
      },
    });

    return NextResponse.json({ success: true, venue });
  } catch (error: any) {
    console.error('Error updating venue:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update venue' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Venue not found' }, { status: 404 });
    }

    await prisma.venue.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'VENUE',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting venue:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete venue' }, { status: 500 });
  }
}
