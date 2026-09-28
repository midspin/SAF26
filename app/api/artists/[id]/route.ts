import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        artworks: true,
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
        technicalRequirements: { include: { artwork: true } },
        productionRequirements: { include: { artwork: true } },
        allocations: {
          include: {
            inventoryItem: true,
            venue: true,
            room: true,
          },
        },
        purchaseRequests: {
          include: {
            vendor: true,
            venue: true,
            room: true,
          },
        },
        rentalRecords: {
          include: {
            vendor: true,
            venue: true,
            room: true,
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ success: false, error: 'Artist not found' }, { status: 404 });
    }

    // Calculate Artist Information Completeness Percentage
    let totalPoints = 10;
    let earnedPoints = 0;

    const missingFields: { field: string; section: string; tab: string }[] = [];

    if (artist.artistPhoto) earnedPoints++;
    else missingFields.push({ field: 'Artist Photo', section: 'Personal Details', tab: 'Overview' });

    if (artist.biography) earnedPoints++;
    else missingFields.push({ field: 'Biography', section: 'Bio & Links', tab: 'Overview' });

    if (artist.email || artist.phone) earnedPoints++;
    else missingFields.push({ field: 'Contact Email/Phone', section: 'Contact Info', tab: 'Overview' });

    if (artist.artworks.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Artwork Registration', section: 'Artworks', tab: 'Artworks' });

    if (artist.curatorAssignments.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Assigned Curator', section: 'Curatorial Team', tab: 'Curator' });

    if (artist.pocAssignments.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Point of Contact (POC)', section: 'POC Liaison', tab: 'POC' });

    if (artist.programmingAssignments.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Programming Staff', section: 'Programming', tab: 'Programming' });

    if (artist.installations.length > 0 && artist.installations[0].roomId) earnedPoints++;
    else missingFields.push({ field: 'Venue & Room Assignment', section: 'Venue Allocation', tab: 'Venue' });

    if (artist.technicalRequirements.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Technical Requirements', section: 'Technical Specs', tab: 'Technical' });

    if (artist.productionRequirements.length > 0) earnedPoints++;
    else missingFields.push({ field: 'Production Requirements', section: 'Production Specs', tab: 'Production' });

    const completenessScore = Math.round((earnedPoints / totalPoints) * 100);

    // Activity Log for Artist
    const activityLogs = await prisma.auditLog.findMany({
      where: {
        entityId: artist.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      artist,
      completenessScore,
      missingFields,
      activityLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.artist.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Artist not found' }, { status: 404 });

    const {
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
      curatorIds,
      pocIds,
      programmingIds,
    } = body;

    const artist = await prisma.artist.update({
      where: { id },
      data: {
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
      },
    });

    // Update Curator assignments if provided
    if (Array.isArray(curatorIds)) {
      await prisma.artistCuratorAssignment.deleteMany({ where: { artistId: id } });
      if (curatorIds.length > 0) {
        await prisma.artistCuratorAssignment.createMany({
          data: curatorIds.map((cId: string) => ({ artistId: id, curatorId: cId })),
        });
      }
    }

    // Update POC assignments if provided
    if (Array.isArray(pocIds)) {
      await prisma.artistPocAssignment.deleteMany({ where: { artistId: id } });
      if (pocIds.length > 0) {
        await prisma.artistPocAssignment.createMany({
          data: pocIds.map((pId: string) => ({ artistId: id, pocId: pId })),
        });
      }
    }

    // Update Programming assignments if provided
    if (Array.isArray(programmingIds)) {
      await prisma.artistProgrammingAssignment.deleteMany({ where: { artistId: id } });
      if (programmingIds.length > 0) {
        await prisma.artistProgrammingAssignment.createMany({
          data: programmingIds.map((prId: string) => ({ artistId: id, programmingPersonId: prId })),
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        eventId: artist.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'ARTIST',
        entityId: artist.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(artist),
      },
    });

    return NextResponse.json({ success: true, artist });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.artist.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Artist not found' }, { status: 404 });

    await prisma.artist.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: 'SUPER ADMIN',
        entityType: 'ARTIST',
        entityId: id,
        action: 'DELETE',
        previousValueJson: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete artist' }, { status: 500 });
  }
}
