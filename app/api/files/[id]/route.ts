import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return new Response(fileRecord.data, {
      status: 200,
      headers: {
        'Content-Type': fileRecord.mimeType || 'application/octet-stream',
        'Content-Length': fileRecord.size.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileRecord.filename)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve file' },
      { status: 500 }
    );
  }
}
