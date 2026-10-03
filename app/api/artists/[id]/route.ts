import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const artist = await prisma.artist.findUnique({
      where: { id },
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
      curatorIds,
      pocIds,
      programmingIds,
      artworks,
    } = body;

    // Enforce role restriction for Super Admin & Programming Team
    if (userRole && !isAuthorized(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only Super Admin and Programming Team can edit artists.' },
        { status: 403 }
      );
    }

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
        arrivalDate: arrivalDate !== undefined ? arrivalDate : existing.arrivalDate,
        departureDate: departureDate !== undefined ? departureDate : existing.departureDate,
        travelNotes: travelNotes !== undefined ? travelNotes : existing.travelNotes,
        lodgingDetails: lodgingDetails !== undefined ? lodgingDetails : existing.lodgingDetails,
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

    // Handle Artworks update & venue/room assignment if provided
    if (Array.isArray(artworks)) {
      const existingArtworks = await prisma.artwork.findMany({ where: { artistId: id } });
      const existingIds = existingArtworks.map((a) => a.id);
      const incomingIds = artworks.map((a: any) => a.id).filter(Boolean);

      // Artworks to delete
      const toDeleteIds = existingIds.filter((existingId) => !incomingIds.includes(existingId));
      if (toDeleteIds.length > 0) {
        await prisma.artwork.deleteMany({ where: { id: { in: toDeleteIds } } });
      }

      // Upsert incoming artworks
      for (const item of artworks) {
        if (!item.artworkName || !item.artworkName.trim()) continue;

        let artworkRecord;
        if (item.id && existingIds.includes(item.id)) {
          artworkRecord = await prisma.artwork.update({
            where: { id: item.id },
            data: {
              artworkName: item.artworkName.trim(),
              medium: item.medium || null,
              dimensions: item.dimensions || null,
              installationType: item.installationType || null,
              notes: item.notes || item.description || null,
              venueId: item.venueId || null,
              roomId: item.roomId || null,
            },
          });
        } else {
          artworkRecord = await prisma.artwork.create({
            data: {
              eventId: artist.eventId,
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
        }

        // Sync ArtistInstallation if venueId/roomId is set
        if (item.venueId || item.roomId) {
          const existingInst = await prisma.artistInstallation.findFirst({
            where: { artistId: artist.id, artworkId: artworkRecord.id },
          });

          if (existingInst) {
            await prisma.artistInstallation.update({
              where: { id: existingInst.id },
              data: {
                venueId: item.venueId || null,
                roomId: item.roomId || null,
              },
            });
          } else {
            await prisma.artistInstallation.create({
              data: {
                eventId: artist.eventId,
                artistId: artist.id,
                artworkId: artworkRecord.id,
                venueId: item.venueId || null,
                roomId: item.roomId || null,
                installationStatus: 'Planned',
              },
            });
          }
        }
      }
    }

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
        eventId: artist.eventId,
        userName: body.userName || 'Admin User',
        userRole: body.userRole || 'SUPER ADMIN',
        entityType: 'ARTIST',
        entityId: artist.id,
        action: 'UPDATE',
        previousValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(fullArtist),
      },
    });

    return NextResponse.json({ success: true, artist: fullArtist });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get('userRole');

    // Enforce role restriction for Super Admin & Programming Team
    if (userRole && !isAuthorized(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only Super Admin and Programming Team can delete artists.' },
        { status: 403 }
      );
    }

    const existing = await prisma.artist.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Artist not found' }, { status: 404 });

    await prisma.artist.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        eventId: existing.eventId,
        userName: 'Admin User',
        userRole: userRole || 'SUPER ADMIN',
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
