import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        artist: true,
        installations: {
          include: {
            venue: true,
            room: true,
          },
        },
      },
    });

    if (!artwork) {
      return NextResponse.json(
        { success: false, error: 'Artwork not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, artwork });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      artistId,
      artworkName,
      description,
      images,
      dimensions,
      weight,
      medium,
      installationType,
      techProdLayout,
      notes,
    } = body;

    const artwork = await prisma.artwork.update({
      where: { id },
      data: {
        ...(artistId ? { artistId } : {}),
        ...(artworkName ? { artworkName } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(images !== undefined ? { images } : {}),
        ...(dimensions !== undefined ? { dimensions } : {}),
        ...(weight !== undefined ? { weight } : {}),
        ...(medium !== undefined ? { medium } : {}),
        ...(installationType !== undefined ? { installationType } : {}),
        ...(techProdLayout !== undefined ? { techProdLayout } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      include: {
        artist: true,
      },
    });

    if (techProdLayout) {
      try {
        const addedByName = body.userName || body.createdByName || body.addedBy || (body.userRole ? `${body.userRole} Member` : 'Spatial Designer');
        await prisma.notification.create({
          data: {
            eventId: artwork.eventId,
            title: '📐 Spatial Drawing Uploaded',
            message: `Spatial layout drawing for artwork "${artwork.artworkName}" was updated/uploaded by ${addedByName}.`,
            addedBy: addedByName,
            type: 'info',
            targetRoles: 'PRODUCTION & LAYOUT,PROGRAMMING',
            link: artwork.artistId ? `/artists/${artwork.artistId}` : '/artworks',
          },
        });
      } catch (notifErr) {
        console.error('Failed to create artwork drawing notification:', notifErr);
      }
    }

    return NextResponse.json({ success: true, artwork });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.artwork.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
