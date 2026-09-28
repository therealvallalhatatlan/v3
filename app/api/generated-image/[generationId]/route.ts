import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/supabase/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin';
import { MEDIA_BUCKET } from '../../../../lib/supabase/media';

export async function DELETE(
  _req: Request,
  { params }: { params: { generationId: string } },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const generationId = String(params.generationId || '').trim();
  if (!generationId) return NextResponse.json({ error: 'Missing generationId' }, { status: 400 });

  try {
    const supabase = await createSupabaseServerClient();

    const { data: generation, error: generationError } = await supabase
      .from('generated_images')
      .select('id, owner_id, storage_path, edit_session_id, parent_generation_id')
      .eq('id', generationId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (generationError) {
      throw new Error(`Unable to load image: ${generationError.message}`);
    }

    if (!generation) {
      return NextResponse.json({ error: 'A kép nem található.' }, { status: 404 });
    }

    const adminSupabase = createSupabaseAdminClient();

    const { error: storageError } = await adminSupabase.storage
      .from(MEDIA_BUCKET)
      .remove([generation.storage_path]);

    if (storageError) {
      throw new Error(`A kép fájljának törlése sikertelen: ${storageError.message}`);
    }

    const { error: deleteError } = await adminSupabase
      .from('generated_images')
      .delete()
      .eq('id', generation.id)
      .eq('owner_id', user.id);

    if (deleteError) {
      throw new Error(`A kép metaadatainak törlése sikertelen: ${deleteError.message}`);
    }

    if (generation.edit_session_id) {
      const sessionId = String(generation.edit_session_id);

      const { data: remaining, error: remainingError } = await adminSupabase
        .from('generated_images')
        .select('id, edit_index, created_at')
        .eq('owner_id', user.id)
        .eq('edit_session_id', sessionId)
        .order('edit_index', { ascending: false })
        .order('created_at', { ascending: false });

      if (remainingError) {
        console.error('Unable to rebuild edit session state after delete:', remainingError);
      } else {
        const { data: session } = await adminSupabase
          .from('image_edit_sessions')
          .select('id, root_generation_id, current_generation_id')
          .eq('id', sessionId)
          .eq('owner_id', user.id)
          .maybeSingle();

        if (session) {
          const nextRootId =
            session.root_generation_id === generation.id
              ? (remaining?.[remaining.length - 1]?.id || null)
              : session.root_generation_id;

          const nextCurrentId =
            session.current_generation_id === generation.id
              ? (remaining?.[0]?.id || nextRootId)
              : session.current_generation_id;

          await adminSupabase
            .from('image_edit_sessions')
            .update({
              root_generation_id: nextRootId,
              current_generation_id: nextCurrentId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .eq('owner_id', user.id);
        }
      }
    }

    return NextResponse.json({ ok: true, deletedGenerationId: generation.id });
  } catch (error: any) {
    console.error('Generated image delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'A kép törlése sikertelen.' },
      { status: 500 },
    );
  }
}
