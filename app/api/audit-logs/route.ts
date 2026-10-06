import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventId) where.eventId = eventId;

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const hasMore = skip + logs.length < totalCount;
    const nextPage = hasMore ? page + 1 : null;

    // Truncate heavy JSON dumps in list views to prevent MB-sized transfers
    const sanitizedLogs = logs.map((log) => ({
      ...log,
      newValueJson: log.newValueJson
        ? log.newValueJson.length > 200
          ? log.newValueJson.slice(0, 200) + '... (truncated)'
          : log.newValueJson
        : null,
    }));

    return NextResponse.json({
      success: true,
      logs: sanitizedLogs,
      totalCount,
      hasMore,
      nextPage,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

