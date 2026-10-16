import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFromCache, setToCache, invalidateCache } from '@/lib/cache';

const ALLOWED_MUTATION_ROLES = [
  'SUPER ADMIN',
  'SUPERADMIN',
  'ADMIN',
  'PROGRAMMING',
  'PROGRAMMER',
  'PROGRAMMERS',
  'PROGRAMMING TEAM',
  'PROGRAMMING HEAD',
  'TBL',
  'TBL TEAM',
  'TRAVEL',
  'TRAVEL TEAM',
  'TRAVEL & LODGING',
  'TRAVEL & BOARDING & LODGING',
];

function isAuthorized(role?: string): boolean {
  if (!role) return true;
  return ALLOWED_MUTATION_ROLES.includes(role.trim().toUpperCase());
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const cacheKey = `artist_${id}`;
    const cached = getFromCache<any>(cacheKey, 60000);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      });
    }

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
        productionAssignments: { include: { productionPerson: true } },
        spatialAssignments: { include: { spatialDesigner: true } },
        installations: {
          include: {
            artwork: true,
            venue: true,
            room: true,
          },
        },
        technicalRequirements: { include: { artwork: true } },
        productionRequirements: { include: { artwork: true }, orderBy: { createdAt: 'desc' } },
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

    // Activity Log - lightweight initialization (audit logs are not displayed on artist 360 overview)
    const activityLogs: any[] = [];

    const responseData = {
      success: true,
      artist,
      completenessScore,
      missingFields,
      activityLogs,
    };

    setToCache(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
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
      category,
      arrivalDate,
      departureDate,
      travelNotes,
      lodgingDetails,
      flightDoc,
      hotelDoc,
      status,
      curatorIds,
      pocIds,
      programmingIds,
      productionIds,
      spatialDesignerIds,
      artworks,
    } = body;

    // Enforce role restriction for Super Admin & Programming Team
    if (userRole && !isAuthorized(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Only Super Admin, Programming, and TBL Team can update artist details.' },
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
        category: category !== undefined ? category : existing.category,
        arrivalDate: arrivalDate !== undefined ? arrivalDate : existing.arrivalDate,
        departureDate: departureDate !== undefined ? departureDate : existing.departureDate,
        travelNotes: travelNotes !== undefined ? travelNotes : existing.travelNotes,
        lodgingDetails: lodgingDetails !== undefined ? lodgingDetails : existing.lodgingDetails,
        flightDoc: flightDoc !== undefined ? flightDoc : existing.flightDoc,
        hotelDoc: hotelDoc !== undefined ? hotelDoc : existing.hotelDoc,
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

    // Update Production assignments if provided
    if (Array.isArray(productionIds)) {
      await prisma.artistProductionAssignment.deleteMany({ where: { artistId: id } });
      if (productionIds.length > 0) {
        await prisma.artistProductionAssignment.createMany({
          data: productionIds.map((pId: string) => ({ artistId: id, productionPersonId: pId })),
        });
      }
    }

    // Update Spatial Designer assignments if provided
    if (Array.isArray(spatialDesignerIds)) {
      await prisma.artistSpatialAssignment.deleteMany({ where: { artistId: id } });
      if (spatialDesignerIds.length > 0) {
        await prisma.artistSpatialAssignment.createMany({
          data: spatialDesignerIds.map((sId: string) => ({ artistId: id, spatialDesignerId: sId })),
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

        const assignedRoomIds: string[] = Array.isArray(item.roomIds) && item.roomIds.length > 0
          ? item.roomIds
          : (item.roomId ? [item.roomId] : []);

        // Validate that room IDs exist in database to prevent foreign key errors
        const validRooms = assignedRoomIds.length > 0
          ? await prisma.room.findMany({
              where: { id: { in: assignedRoomIds } },
              select: { id: true },
            })
          : [];
        const validRoomIds = validRooms.map((r) => r.id);
        const primaryRoomId = validRoomIds[0] || null;
        const roomIdsJson = validRoomIds.length > 0 ? JSON.stringify(validRoomIds) : null;

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
              roomId: primaryRoomId,
              roomIdsJson,
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
              roomId: primaryRoomId,
              roomIdsJson,
            },
          });
        }

        // Sync ArtistInstallation if venueId is set
        if (item.venueId) {
          // Remove outdated installations for this specific artwork
          await prisma.artistInstallation.deleteMany({
            where: { artistId: artist.id, artworkId: artworkRecord.id },
          });

          if (validRoomIds.length > 0) {
            for (const rId of validRoomIds) {
              await prisma.artistInstallation.create({
                data: {
                  eventId: artist.eventId,
                  artistId: artist.id,
                  artworkId: artworkRecord.id,
                  venueId: item.venueId,
                  roomId: rId,
                  installationStatus: 'Planned',
                },
              });
            }
          } else {
            await prisma.artistInstallation.create({
              data: {
                eventId: artist.eventId,
                artistId: artist.id,
                artworkId: artworkRecord.id,
                venueId: item.venueId,
                roomId: null,
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
        productionAssignments: { include: { productionPerson: true } },
        spatialAssignments: { include: { spatialDesigner: true } },
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

    invalidateCache('artist');

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

    invalidateCache('artist');

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete artist' }, { status: 500 });
  }
}
