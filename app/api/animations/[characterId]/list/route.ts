import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/supabase/server';
import { listVideoJobs, toClientAnimationJobs } from '../../../../../lib/supabase/videoJobs';

export async function GET(req: NextRequest, { params }: { params: { characterId: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const characterId = String(params.characterId || '').trim();
  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
  }

  try {
    const jobs = await listVideoJobs(user.id, characterId);
    const clientJobs = await toClientAnimationJobs(jobs);
    return NextResponse.json({ jobs: clientJobs });
  } catch (error: any) {
    console.error('Video job list error:', error);
    return NextResponse.json(
      { error: error?.message || 'Nem sikerült betölteni a videókat.' },
      { status: 500 },
    );
  }
}
