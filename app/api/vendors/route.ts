import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            inventoryItems: true,
            purchaseRequests: true,
            rentalRecords: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, vendors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, company, category, contactPerson, email, phone, website, address, notes } = body;

    const vendor = await prisma.vendor.create({
      data: {
        name,
        company,
        category: category || 'AV & Lighting',
        contactPerson,
        email,
        phone,
        website,
        address,
        notes,
      },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
