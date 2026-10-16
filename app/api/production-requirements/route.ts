import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const artistId = searchParams.get('artistId');
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    if (id) {
      const item = await prisma.productionRequirement.findUnique({
        where: { id },
        include: {
          artist: true,
          artwork: {
            include: {
              venue: true,
              room: true,
            },
          },
          event: true,
        },
      });

      if (!item) {
        return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, item });
    }

    const where: any = {};
    if (artistId) where.artistId = artistId;
    if (eventId) where.eventId = eventId;
    if (status && status !== 'ALL') where.status = status;

    const items = await prisma.productionRequirement.findMany({
      where,
      include: {
        artist: true,
        artwork: {
          include: {
            venue: true,
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Error in GET /api/production-requirements:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      artistId,
      artworkId,
      eventId: rawEventId,
      productionCategory,
      subCategory,
      element,
      typeSpec,
      referenceImages,
      length,
      breadth,
      height,
      unit,
      quantity,
      source,
      status,
      assignedTo,
      remarks,
    } = body;

    if (!artistId) {
      return NextResponse.json({ success: false, error: 'Artist ID is required' }, { status: 400 });
    }

    if (!element || !element.trim()) {
      return NextResponse.json({ success: false, error: 'Element/Item name is required' }, { status: 400 });
    }

    let eventId = rawEventId;
    if (!eventId) {
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
        select: { eventId: true },
      });
      eventId = artist?.eventId;
    }

    if (!eventId) {
      const activeEvent = await prisma.event.findFirst({ where: { status: 'Active' } });
      eventId = activeEvent?.id || (await prisma.event.findFirst())?.id;
    }

    const imagesJson = Array.isArray(referenceImages)
      ? JSON.stringify(referenceImages)
      : typeof referenceImages === 'string'
      ? referenceImages
      : '[]';

    const item = await prisma.productionRequirement.create({
      data: {
        eventId: eventId!,
        artistId,
        artworkId: artworkId || null,
        productionCategory: productionCategory || null,
        subCategory: subCategory || null,
        element: element.trim(),
        typeSpec: typeSpec || null,
        referenceImages: imagesJson,
        length: length !== undefined && length !== null ? String(length) : null,
        breadth: breadth !== undefined && breadth !== null ? String(breadth) : null,
        height: height !== undefined && height !== null ? String(height) : null,
        unit: unit || 'mm',
        quantity: parseInt(quantity) || 1,
        source: source || 'SAF Inventory',
        status: status || 'requisition in pending',
        assignedTo: assignedTo || null,
        remarks: remarks || null,
        // Legacy fallback fields for backward compatibility
        requirementType: productionCategory || 'General',
        description: element.trim(),
        specification: typeSpec || null,
        notes: remarks || null,
      },
      include: {
        artist: true,
        artwork: true,
      },
    });

    invalidateCache('artist');
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error in POST /api/production-requirements:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      artworkId,
      productionCategory,
      subCategory,
      element,
      typeSpec,
      referenceImages,
      length,
      breadth,
      height,
      unit,
      quantity,
      source,
      status,
      assignedTo,
      remarks,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const imagesJson = Array.isArray(referenceImages)
      ? JSON.stringify(referenceImages)
      : typeof referenceImages === 'string'
      ? referenceImages
      : undefined;

    const item = await prisma.productionRequirement.update({
      where: { id },
      data: {
        ...(artworkId !== undefined ? { artworkId: artworkId || null } : {}),
        ...(productionCategory !== undefined ? { productionCategory } : {}),
        ...(subCategory !== undefined ? { subCategory } : {}),
        ...(element !== undefined ? { element: element.trim(), description: element.trim() } : {}),
        ...(typeSpec !== undefined ? { typeSpec, specification: typeSpec } : {}),
        ...(imagesJson !== undefined ? { referenceImages: imagesJson } : {}),
        ...(length !== undefined ? { length: length !== null ? String(length) : null } : {}),
        ...(breadth !== undefined ? { breadth: breadth !== null ? String(breadth) : null } : {}),
        ...(height !== undefined ? { height: height !== null ? String(height) : null } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(quantity !== undefined ? { quantity: parseInt(quantity) || 1 } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(remarks !== undefined ? { remarks, notes: remarks } : {}),
      },
      include: {
        artist: true,
        artwork: true,
      },
    });

    invalidateCache('artist');
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error in PUT /api/production-requirements:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await prisma.productionRequirement.delete({
      where: { id },
    });

    invalidateCache('artist');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/production-requirements:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
