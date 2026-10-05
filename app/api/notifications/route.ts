import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const roleParam = searchParams.get('role');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

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
              (t.includes('SPATIAL') && normRole.includes('SPATIAL')) ||
              (t.includes('TECHNICAL') && normRole.includes('TECHNICAL')) ||
              (t.includes('PRODUCTION') && normRole.includes('PRODUCTION')) ||
              (t.includes('INVENTORY') && normRole.includes('INVENTORY')) ||
              (t.includes('PROGRAMMING') && normRole.includes('PROGRAMMING')) ||
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
    const { eventId, title, message, addedBy, type, targetRoles, link } = body;

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
        addedBy: addedBy || null,
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      await prisma.notification.deleteMany({});
      return NextResponse.json({ success: true, message: 'All notifications cleared.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required.' }, { status: 400 });
    }

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All marked as read.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required.' }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

