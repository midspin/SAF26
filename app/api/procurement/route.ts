import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const department = searchParams.get('department');

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (department && department !== 'ALL') where.department = department;

    const purchaseRequests = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: true,
        artwork: true,
        venue: true,
        room: true,
        vendor: true,
        quotes: { include: { vendor: true } },
      },
    });

    const rentalRecords = await prisma.rentalRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: true,
        artwork: true,
        venue: true,
        room: true,
        vendor: true,
        quotes: { include: { vendor: true } },
      },
    });

    return NextResponse.json({
      success: true,
      purchases: purchaseRequests,
      rentals: rentalRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type, // PURCHASE or RENTAL
      eventId: rawEventId,
      department,
      artistId,
      artworkId,
      venueId,
      roomId,
      itemName,
      brand,
      model,
      itemType,
      category,
      specification,
      quantity,
      uom,
      priority,
      requiredDate,
      vendorId,
      purchaseLink,
      rentalLink,
      estimatedUnitCost,
      estimatedTotal,
      rentalRate,
      rateType,
      rentalStart,
      rentalEnd,
      notes,
      requestedBy,
    } = body;

    let eventId = rawEventId;
    if (!eventId) {
      const activeEvent = await prisma.event.findFirst({ where: { status: 'Active' } });
      eventId = activeEvent?.id || (await prisma.event.findFirst())?.id;
    }

    const qty = parseInt(quantity) || 1;

    if (type === 'RENTAL') {
      const record = await prisma.rentalRecord.create({
        data: {
          eventId,
          department: department || 'TECHNICAL',
          artistId: artistId || null,
          artworkId: artworkId || null,
          venueId: venueId || null,
          roomId: roomId || null,
          itemName,
          category: category || 'General',
          specification,
          quantity: qty,
          uom: uom || 'Nos',
          vendorId: vendorId || null,
          rentalLink: rentalLink || purchaseLink || null,
          rentalRate: parseFloat(rentalRate) || null,
          rateType: rateType || 'Daily',
          rentalStart: rentalStart || null,
          rentalEnd: rentalEnd || null,
          estimatedTotal: parseFloat(estimatedTotal) || null,
          status: 'Request Raised',
          requestedBy: requestedBy || 'Admin User',
          notes,
        },
      });

      return NextResponse.json({ success: true, rental: record, record });
    } else {
      const unitCost = parseFloat(estimatedUnitCost) || 0;
      const estTotal = parseFloat(estimatedTotal) || unitCost * qty;

      const record = await prisma.purchaseRequest.create({
        data: {
          eventId,
          department: department || 'TECHNICAL',
          artistId: artistId || null,
          artworkId: artworkId || null,
          venueId: venueId || null,
          roomId: roomId || null,
          itemName,
          brand: brand || null,
          model: model || null,
          itemType: itemType || 'Purchase',
          category: category || 'General',
          specification,
          quantity: qty,
          uom: uom || 'Nos',
          priority: priority || 'Medium',
          requiredDate: requiredDate || null,
          vendorId: vendorId || null,
          purchaseLink: purchaseLink || null,
          estimatedUnitCost: unitCost,
          estimatedTotal: estTotal,
          status: 'Request Raised',
          requestedBy: requestedBy || 'Admin User',
          notes,
        },
      });

      return NextResponse.json({ success: true, purchase: record, record });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      id,
      itemName,
      brand,
      model,
      itemType,
      quantity,
      purchaseLink,
      status,
      approvedCost,
      actualCost,
      vendorId,
      notes,
    } = body;

    if (type === 'RENTAL') {
      const record = await prisma.rentalRecord.update({
        where: { id },
        data: {
          ...(itemName ? { itemName } : {}),
          ...(quantity ? { quantity: parseInt(quantity) || 1 } : {}),
          ...(purchaseLink !== undefined ? { rentalLink: purchaseLink } : {}),
          ...(status ? { status } : {}),
          ...(actualCost ? { actualTotal: parseFloat(actualCost) } : {}),
          ...(vendorId ? { vendorId } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      return NextResponse.json({ success: true, rental: record, record });
    } else {
      const record = await prisma.purchaseRequest.update({
        where: { id },
        data: {
          ...(itemName ? { itemName } : {}),
          ...(brand !== undefined ? { brand } : {}),
          ...(model !== undefined ? { model } : {}),
          ...(itemType !== undefined ? { itemType } : {}),
          ...(quantity ? { quantity: parseInt(quantity) || 1 } : {}),
          ...(purchaseLink !== undefined ? { purchaseLink } : {}),
          ...(status ? { status } : {}),
          ...(approvedCost ? { approvedCost: parseFloat(approvedCost) } : {}),
          ...(actualCost ? { actualCost: parseFloat(actualCost), finalCost: parseFloat(actualCost) } : {}),
          ...(vendorId ? { vendorId } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      return NextResponse.json({ success: true, purchase: record, record });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (type === 'RENTAL') {
      await prisma.rentalRecord.delete({ where: { id } });
    } else {
      await prisma.purchaseRequest.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
