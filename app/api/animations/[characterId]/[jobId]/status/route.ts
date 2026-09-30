import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../../../lib/animationProviders';
import { getCurrentUser } from '../../../../../../lib/supabase/server';
import {
  getClientAnimationJob,
  getVideoJob,
  updateVideoJob,
} from '../../../../../../lib/supabase/videoJobs';
import { uploadMedia } from '../../../../../../lib/supabase/media';

async function downloadVideoBuffer(videoUrl: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(videoUrl, { signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error('Failed to download provider video: ' + response.status + ' ' + text);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
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
      const failed = await updateVideoJob(user.id, characterId, jobId, {
        status: 'failed',
        error: 'Missing provider job id',
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json(
        { job: failed ? await getClientAnimationJob(failed) : null },
        { status: 500 },
      );
    }

    const provider = getAnimationProvider(job.provider as 'replicate');
    const providerStatus = await provider.getAnimationStatus(job.external_job_id);

    if (providerStatus.status === 'done') {
      if (!providerStatus.outputVideoUrl) {
        const failed = await updateVideoJob(user.id, characterId, jobId, {
          status: 'failed',
          error: 'Provider returned done without video output',
          completed_at: new Date().toISOString(),
        });

        return NextResponse.json(
          { job: failed ? await getClientAnimationJob(failed) : null },
          { status: 500 },
        );
      }

      let videoStoragePath = job.video_storage_path;
      const providerVideoUrl = providerStatus.outputVideoUrl;

      if (!videoStoragePath) {
        try {
          const videoBuffer = await downloadVideoBuffer(providerVideoUrl);
          videoStoragePath = user.id + '/videos/' + jobId + '.mp4';
          await uploadMedia(videoStoragePath, videoBuffer, 'video/mp4');
        } catch (uploadError: any) {
          console.warn(
            'Video persistence failed, keeping provider URL:',
            uploadError?.message || uploadError,
          );
          videoStoragePath = undefined;
        }
      }

      const doneUpdates: Parameters<typeof updateVideoJob>[3] = {
        status: 'done',
        provider_video_url: providerVideoUrl,
        error: null,
        completed_at: new Date().toISOString(),
      };

      // Do not clear a path another concurrent poll may already have stored.
      if (videoStoragePath) {
        doneUpdates.video_storage_path = videoStoragePath;
      }

      const done = await updateVideoJob(
        user.id,
        characterId,
        jobId,
        doneUpdates,
      );

      if (!done) {
        return NextResponse.json(
          { error: 'Video job disappeared while finalizing' },
          { status: 500 },
        );
      }

      return NextResponse.json({ job: await getClientAnimationJob(done) });
    }

    if (providerStatus.status === 'failed' || providerStatus.status === 'canceled') {
      const failed = await updateVideoJob(user.id, characterId, jobId, {
        status: providerStatus.status,
        error: providerStatus.error || 'Provider failed job',
        completed_at: new Date().toISOString(),
      });

      return NextResponse.json({ job: await getClientAnimationJob(failed || job) });
    }

    const processing = await updateVideoJob(user.id, characterId, jobId, {
      status: providerStatus.status,
      error: null,
    });

    return NextResponse.json({ job: await getClientAnimationJob(processing || job) });
  } catch (error: any) {
    console.error('Video status error:', error);
    return NextResponse.json(
      { error: error?.message || 'Status update failed' },
      { status: 500 },
    );
  }
}
