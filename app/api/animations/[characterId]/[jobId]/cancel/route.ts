import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../../../lib/animationProviders';
import { getCurrentUser } from '../../../../../../lib/supabase/server';
import {
  getClientAnimationJob,
  getVideoJob,
  updateVideoJob,
} from '../../../../../../lib/supabase/videoJobs';

export async function POST(
  req: NextRequest,
  { params }: { params: { characterId: string; jobId: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const characterId = String(params.characterId || '').trim();
  const jobId = String(params.jobId || '').trim();

  if (!characterId || !jobId) {
    return NextResponse.json(
      { error: 'Missing characterId or jobId' },
      { status: 400 },
    );
  }

  try {
    const job = await getVideoJob(user.id, characterId, jobId);
    if (!job) {
      return NextResponse.json({ error: 'Animation job not found' }, { status: 404 });
    }

    if (job.status === 'done' || job.status === 'failed' || job.status === 'canceled') {
      return NextResponse.json({ job: await getClientAnimationJob(job) });
    }

    if (!job.external_job_id) {
      const canceled = await updateVideoJob(user.id, characterId, jobId, {
        status: 'canceled',
        error: null,
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({ job: await getClientAnimationJob(canceled || job) });
    }

    const provider = getAnimationProvider(job.provider as 'replicate');
    await provider.cancelAnimation(job.external_job_id);

    const updated = await updateVideoJob(user.id, characterId, jobId, {
      status: 'canceled',
      completed_at: new Date().toISOString(),
      error: null,
    });

    return NextResponse.json({ job: await getClientAnimationJob(updated || job) });
  } catch (error: any) {
    console.error('Video cancel error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel animation' },
      { status: 500 },
    );
  }
}
