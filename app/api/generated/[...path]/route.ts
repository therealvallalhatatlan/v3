import { NextRequest, NextResponse } from 'next/server';
import { getStoragePath } from '../../../../lib/paths';
import fs from 'fs';
import path from 'path';

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4') return 'video/mp4';
  return 'application/octet-stream';
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!params.path || params.path.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  // path: [characterId, filename]
  const relPath = path.join('generated', ...params.path);
  const filePath = getStoragePath(relPath);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
  const stat = fs.statSync(filePath);
  const contentType = getContentType(filePath);
  const range = req.headers.get('range');

  if (range && contentType === 'video/mp4') {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = Number(parts[0]);
    const end = parts[1] ? Number(parts[1]) : stat.size - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    return new NextResponse(stream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  const file = fs.readFileSync(filePath);
  return new NextResponse(file, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
