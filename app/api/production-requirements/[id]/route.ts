import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

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
  } catch (error: any) {
    console.error('Error in GET /api/production-requirements/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
