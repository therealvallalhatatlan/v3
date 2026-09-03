import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../../../lib/animationProviders';
import {
  getAnimationJob,
  saveAnimationVideo,
  updateAnimationJob,
} from '../../../../../../lib/storage';

async function downloadVideoBuffer(videoUrl: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(videoUrl, { signal: controller.signal });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to download provider video: ${response.status} ${text}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(
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

  if (job.status === 'done' || job.status === 'failed' || job.status === 'canceled') {
    return NextResponse.json({ job });
  }

  if (!job.externalJobId) {
    const failed = updateAnimationJob(characterId, jobId, {
      status: 'failed',
      error: 'Missing provider job id',
      completedAt: Date.now(),
    });
    return NextResponse.json({ job: failed }, { status: 500 });
  }

  try {
    const provider = getAnimationProvider(job.provider);
    const providerStatus = await provider.getAnimationStatus(job.externalJobId);

    if (providerStatus.status === 'done') {
      if (!providerStatus.outputVideoUrl) {
        const failed = updateAnimationJob(characterId, jobId, {
          status: 'failed',
          error: 'Provider returned done without video output',
          completedAt: Date.now(),
        });
        return NextResponse.json({ job: failed }, { status: 500 });
      }

      // Try to download and cache the video locally.
      // If download fails or times out, still mark as done and serve directly from provider.
      let resolvedVideoUrl = providerStatus.outputVideoUrl;
      try {
        const videoBuffer = await downloadVideoBuffer(providerStatus.outputVideoUrl);
        const localPath = saveAnimationVideo(characterId, jobId, videoBuffer);
        resolvedVideoUrl = `/api${localPath.replace(/\\/g, '/')}`;
      } catch (downloadErr: any) {
        console.warn('Video download failed, using provider URL directly:', downloadErr.message);
      }

      const done = updateAnimationJob(characterId, jobId, {
        status: 'done',
        videoUrl: resolvedVideoUrl,
        completedAt: Date.now(),
        error: undefined,
      });

      return NextResponse.json({ job: done });
    }

    if (providerStatus.status === 'failed' || providerStatus.status === 'canceled') {
      const failed = updateAnimationJob(characterId, jobId, {
        status: providerStatus.status,
        error: providerStatus.error || 'Provider failed job',
        completedAt: Date.now(),
      });
      return NextResponse.json({ job: failed });
    }

    const processing = updateAnimationJob(characterId, jobId, {
      status: providerStatus.status,
      error: undefined,
    });
    return NextResponse.json({ job: processing });
  } catch (e: any) {
    const failed = updateAnimationJob(characterId, jobId, {
      status: 'failed',
      error: e.message || 'Status update failed',
      completedAt: Date.now(),
    });
    return NextResponse.json({ job: failed }, { status: 500 });
  }
}
