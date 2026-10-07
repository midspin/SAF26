import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';

export const dynamic = 'force-dynamic';

function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName) || '';
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${base}${ext}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Check if this is a chunked upload
    const uploadId = formData.get('uploadId') as string | null;
    const chunkIndexStr = formData.get('chunkIndex') as string | null;
    const totalChunksStr = formData.get('totalChunks') as string | null;
    const filenameRaw = (formData.get('filename') as string | null) || 'file';
    const mimeTypeRaw = (formData.get('mimeType') as string | null) || 'application/octet-stream';
    
    // Chunk or direct file
    const file = (formData.get('chunk') || formData.get('file')) as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file or chunk data provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If chunked upload request
    if (uploadId && chunkIndexStr !== null && totalChunksStr !== null) {
      const chunkIndex = parseInt(chunkIndexStr, 10);
      const totalChunks = parseInt(totalChunksStr, 10);

      // Save chunk to database
      await prisma.uploadChunk.upsert({
        where: {
          uploadId_chunkIndex: {
            uploadId,
            chunkIndex,
          },
        },
        update: {
          chunkData: buffer,
        },
        create: {
          uploadId,
          chunkIndex,
          chunkData: buffer,
        },
      });

      // Count received chunks
      const savedCount = await prisma.uploadChunk.count({
        where: { uploadId },
      });

      // If all chunks received, assemble the complete file
      if (savedCount >= totalChunks) {
        const chunks = await prisma.uploadChunk.findMany({
          where: { uploadId },
          orderBy: { chunkIndex: 'asc' },
        });

        const combinedBuffer = Buffer.concat(chunks.map((c) => c.chunkData));
        const finalFilename = sanitizeFilename(filenameRaw);

        // Store permanent file in database
        const fileRecord = await prisma.uploadedFile.create({
          data: {
            filename: finalFilename,
            mimeType: mimeTypeRaw,
            size: combinedBuffer.length,
            data: combinedBuffer,
          },
        });

        // Cleanup temporary chunks
        await prisma.uploadChunk.deleteMany({
          where: { uploadId },
        });

        const publicUrl = `/api/files/${fileRecord.id}/${encodeURIComponent(fileRecord.filename)}`;

        return NextResponse.json({
          success: true,
          url: publicUrl,
          filename: fileRecord.filename,
          size: fileRecord.size,
          complete: true,
        });
      }

      return NextResponse.json({
        success: true,
        chunkReceived: chunkIndex,
        totalChunks,
        complete: false,
      });
    }

    // Standard single-file upload (under 4MB)
    const finalFilename = sanitizeFilename(file.name || filenameRaw);
    const mimeType = file.type || mimeTypeRaw;

    const fileRecord = await prisma.uploadedFile.create({
      data: {
        filename: finalFilename,
        mimeType: mimeType,
        size: buffer.length,
        data: buffer,
      },
    });

    const publicUrl = `/api/files/${fileRecord.id}/${encodeURIComponent(fileRecord.filename)}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileRecord.filename,
      size: fileRecord.size,
    });
  } catch (error: any) {
    console.error('Error in /api/upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
