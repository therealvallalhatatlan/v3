import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../../../lib/animationProviders';
import { getAnimationJob, updateAnimationJob } from '../../../../../../lib/storage';

export async function POST(
  req: NextRequest,
  { params }: { params: { characterId: string; jobId: string } }
) {
  const { characterId, jobId } = params;
  if (!characterId || !jobId) {
    return NextResponse.json({ error: 'Missing characterId or jobId' }, { status: 400 });
  }

  const job = getAnimationJob(characterId, jobId);
  if (!job) {
    return NextResponse.json({ error: 'Animation job not found' }, { status: 404 });
  }

  if (!job.externalJobId) {
    return NextResponse.json({ error: 'Animation job has no provider job id' }, { status: 400 });
  }

  try {
    const provider = getAnimationProvider(job.provider);
    await provider.cancelAnimation(job.externalJobId);

    const updated = updateAnimationJob(characterId, jobId, {
      status: 'canceled',
      completedAt: Date.now(),
      error: undefined,
    });

    return NextResponse.json({ job: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to cancel animation' }, { status: 500 });
  }
}
