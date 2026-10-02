import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const fileExt = path.extname(file.name) || '.jpg';
    const sanitizeName = path.basename(file.name, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `img_${Date.now()}_${sanitizeName}${fileExt}`;

    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

      // Ensure uploads directory exists
      await mkdir(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, filename);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
      });
    } catch (fsError: any) {
      // Serverless fallback for read-only filesystem (e.g., EROFS on Vercel)
      console.warn('Local filesystem write failed (Serverless EROFS), falling back to Data URL:', fsError.message);
      const mimeType = file.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename,
      });
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}

