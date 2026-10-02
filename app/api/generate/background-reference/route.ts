import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import {
  createSignedMediaUrl,
  dataUrlToBuffer,
  deleteMedia,
  uploadMedia,
} from '../../../../lib/supabase/media';

const MAX_DATA_URL_LENGTH = 8_000_000;
const MAX_DIMENSION = 2048;

function ownBackgroundPath(userId: string, value: unknown): string {
  const path = String(value || '').trim();
  const prefix = userId + '/background-references/';
  if (!path.startsWith(prefix) || path.length <= prefix.length) {
    throw new Error('Invalid background reference path');
  }
  return path;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const imageDataUrl = String(body?.imageDataUrl || '').trim();
    if (!imageDataUrl) {
      return NextResponse.json({ error: 'Missing imageDataUrl' }, { status: 400 });
    }
    if (imageDataUrl.length > MAX_DATA_URL_LENGTH) {
      return NextResponse.json({ error: 'A referencia-kép túl nagy.' }, { status: 413 });
    }
    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(imageDataUrl)) {
      return NextResponse.json({ error: 'Csak PNG, JPG vagy WebP kép tölthető fel.' }, { status: 400 });
    }

    const { buffer } = dataUrlToBuffer(imageDataUrl);
    const processed = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    const path = user.id + '/background-references/' + uuidv4() + '.jpg';
    await uploadMedia(path, processed, 'image/jpeg');
    const url = await createSignedMediaUrl(path, 3600);

    return NextResponse.json({ ok: true, path, url });
  } catch (error: any) {
    console.error('Background reference upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'A referencia-kép feltöltése sikertelen.' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const path = ownBackgroundPath(user.id, body?.path);
    await deleteMedia(path);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Background reference delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'A referencia-kép törlése sikertelen.' },
      { status: 500 },
    );
  }
}
