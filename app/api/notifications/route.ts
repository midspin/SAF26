import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const roleParam = searchParams.get('role');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    let filtered = notifications;
    if (roleParam) {
      const normRole = roleParam.trim().toUpperCase();
      if (normRole !== 'SUPER ADMIN' && normRole !== 'SUPERADMIN') {
        filtered = notifications.filter((n) => {
          if (!n.targetRoles) return true;
          const targets = n.targetRoles.split(',').map((r) => r.trim().toUpperCase());
          return targets.some(
            (t) =>
              t === normRole ||
              (t.includes('TECHNICAL') && normRole.includes('TECHNICAL')) ||
              (t.includes('PRODUCTION') && normRole.includes('PRODUCTION')) ||
              (t.includes('INVENTORY') && normRole.includes('INVENTORY')) ||
              (t.includes('PROCUREMENT') && normRole.includes('PROCUREMENT'))
          );
        });
      }
    }

    return NextResponse.json({ success: true, notifications: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, title, message, type, targetRoles, link } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required.' },
        { status: 400 }
      );
    }

    let targetEventId = eventId;
    if (!targetEventId) {
      const activeEvent =
        (await prisma.event.findFirst({ where: { status: 'Active' } })) ||
        (await prisma.event.findFirst());
      targetEventId = activeEvent?.id;
    }

    if (!targetEventId) {
      return NextResponse.json(
        { success: false, error: 'No active event found.' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        eventId: targetEventId,
        title,
        message,
        type: type || 'info',
        targetRoles: targetRoles || null,
        link: link || null,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
