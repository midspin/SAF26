import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncAllToGoogleSheets } from '@/lib/googleSheets';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const where: any = {};
    if (eventId) where.eventId = eventId;

    const logs = await prisma.googleSheetSyncLog.findMany({
      where,
      orderBy: { lastAttempt: 'desc' },
      take: 50,
    });

    const pendingCount = await prisma.googleSheetSyncLog.count({
      where: { ...where, status: 'Pending' },
    });

    const failedCount = await prisma.googleSheetSyncLog.count({
      where: { ...where, status: 'Failed' },
    });

    const syncedCount = await prisma.googleSheetSyncLog.count({
      where: { ...where, status: 'Synced' },
    });

    const rowMappingsCount = await prisma.googleSheetRowMapping.count();

    const isConfigured = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_PRIVATE_KEY &&
        (process.env.GOOGLE_SHEETS_TECH_ID || process.env.GOOGLE_SHEETS_PROD_ID)
    );

    const config = {
      connectedAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Not Configured (Set GOOGLE_SERVICE_ACCOUNT_EMAIL in .env)',
      techWorkbookId: process.env.GOOGLE_SHEETS_TECH_ID || 'Not Configured',
      prodWorkbookId: process.env.GOOGLE_SHEETS_PROD_ID || 'Not Configured',
      autoSyncEnabled: isConfigured,
      configured: isConfigured,
      lastSyncTime: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      config,
      stats: {
        pendingCount,
        failedCount,
        syncedCount,
        rowMappingsCount,
      },
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, eventId } = body;

    if (action === 'SYNC_NOW' || action === 'RETRY_FAILED') {
      const result = await syncAllToGoogleSheets(eventId);

      if (!result.success && !result.configured) {
        return NextResponse.json({
          success: false,
          error: result.message,
          configured: false,
        }, { status: 400 });
      }

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.message || result.error,
          configured: true,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        totalUpdatedRows: result.totalUpdatedRows,
        syncResults: result.syncResults,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
