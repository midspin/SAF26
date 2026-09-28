import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const type = searchParams.get('type'); // TECHNICAL or PRODUCTION

    const where: any = {};
    if (eventId) where.eventId = eventId;

    let techReqs: any[] = [];
    let prodReqs: any[] = [];

    if (!type || type === 'TECHNICAL') {
      techReqs = await prisma.technicalRequirement.findMany({
        where,
        include: { artist: true, artwork: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!type || type === 'PRODUCTION') {
      prodReqs = await prisma.productionRequirement.findMany({
        where,
        include: { artist: true, artwork: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, technical: techReqs, production: prodReqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      department, // TECHNICAL or PRODUCTION
      eventId,
      artistId,
      artworkId,
      requirementType,
      description,
      quantity,
      specification,
      priority,
      status,
      notes,
    } = body;

    let requirement;
    if (department === 'PRODUCTION') {
      requirement = await prisma.productionRequirement.create({
        data: {
          eventId,
          artistId,
          artworkId,
          requirementType,
          description,
          quantity: parseInt(quantity) || 1,
          specification,
          priority: priority || 'Medium',
          status: status || 'Open',
          notes,
        },
      });
    } else {
      requirement = await prisma.technicalRequirement.create({
        data: {
          eventId,
          artistId,
          artworkId,
          requirementType,
          description,
          quantity: parseInt(quantity) || 1,
          specification,
          priority: priority || 'Medium',
          status: status || 'Open',
          notes,
        },
      });
    }

    return NextResponse.json({ success: true, requirement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
