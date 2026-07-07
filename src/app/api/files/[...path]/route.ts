import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathArray = resolvedParams.path;
    
    // Prevent directory traversal attacks
    if (filePathArray.some(segment => segment.includes('..') || segment.startsWith('.'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const storageDir = process.env.STORAGE_DIR || './storage';
    const baseDir = path.isAbsolute(storageDir) ? storageDir : path.join(process.cwd(), storageDir);
    
    const fullPath = path.join(baseDir, ...filePathArray);

    if (!fs.existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return new NextResponse('Not a file', { status: 400 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type (simple logic for now since we only accept pdf)
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', 'inline'); // or attachment if we want force download
    headers.set('Content-Length', stat.size.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("File stream error:", error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
