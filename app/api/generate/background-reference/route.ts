import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServerClient, getCurrentUser } from '../../../../lib/supabase/server';
import { createSignedMediaUrl, deleteMedia } from '../../../../lib/supabase/media';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
    const contentType = String(body?.contentType || 'image/jpeg').toLowerCase();
    const size = Number(body?.size || 0);

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'Csak JPG, PNG vagy WebP kép tölthető fel.' }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'A referencia-kép legfeljebb 8 MB lehet.' }, { status: 413 });
    }

    const path = user.id + '/background-references/' + uuidv4() + '.jpg';
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from('v3-media')
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      throw new Error(error?.message || 'Nem sikerült feltöltési jogosultságot létrehozni.');
    }

    return NextResponse.json({
      ok: true,
      path,
      token: data.token,
    });
  } catch (error: any) {
    console.error('Background reference upload-url error:', error);
    return NextResponse.json(
      { error: error?.message || 'A referencia-kép feltöltési jogosultságának létrehozása sikertelen.' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const path = ownBackgroundPath(user.id, new URL(req.url).searchParams.get('path'));
    const url = await createSignedMediaUrl(path, 3600);
    return NextResponse.json({ ok: true, path, url });
  } catch (error: any) {
    console.error('Background reference signing error:', error);
    return NextResponse.json(
      { error: error?.message || 'A referencia-kép előnézetének létrehozása sikertelen.' },
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
