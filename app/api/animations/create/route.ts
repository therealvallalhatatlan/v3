import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../lib/animationProviders';
import { getCharacterById, saveAnimationJob } from '../../../../lib/storage';
import { AnimationJob } from '../../../../types/animation';
import { getStoragePath } from '../../../../lib/paths';
import fs from 'fs';
import path from 'path';

function normalizeDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(20, Math.round(parsed)));
}

function extensionToMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function resolveLocalSourceToDataUrl(sourceImageUrl: string): string {
  if (!sourceImageUrl.startsWith('/api/generated/')) {
    return sourceImageUrl;
  }

  const relPart = sourceImageUrl.replace('/api/generated/', '');
  const relPath = path.join('generated', ...relPart.split('/'));
  const fullPath = getStoragePath(relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Source image file not found on storage');
  }

  const mimeType = extensionToMime(fullPath);
  const base64 = fs.readFileSync(fullPath).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      characterId,
      characterIds,
      duoKey,
      sourceImageUrl,
      lastFrameImageUrl,
      prompt,
      motionPrompt,
      durationSeconds,
    } = body;

    const resolvedPrompt = typeof prompt === 'string' ? prompt : motionPrompt;

    if (!characterId || !sourceImageUrl || !resolvedPrompt) {
      return NextResponse.json(
        { error: 'characterId, sourceImageUrl and prompt are required' },
        { status: 400 }
      );
    }

    if (typeof resolvedPrompt !== 'string' || resolvedPrompt.trim().length < 4) {
      return NextResponse.json({ error: 'prompt is too short' }, { status: 400 });
    }

    if (lastFrameImageUrl !== undefined && typeof lastFrameImageUrl !== 'string') {
      return NextResponse.json({ error: 'lastFrameImageUrl must be a string when provided' }, { status: 400 });
    }

    const character = getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    const providerName = 'replicate';
    const provider = getAnimationProvider(providerName);
    const duration = normalizeDuration(durationSeconds);
    const now = Date.now();
    const jobId = crypto.randomUUID();

    const providerSourceImage = resolveLocalSourceToDataUrl(sourceImageUrl);
    const providerLastFrameImage = lastFrameImageUrl?.trim()
      ? resolveLocalSourceToDataUrl(lastFrameImageUrl.trim())
      : undefined;

    const created = await provider.createAnimation({
      sourceImageUrl: providerSourceImage,
      lastFrameImageUrl: providerLastFrameImage,
      prompt: resolvedPrompt.trim(),
      durationSeconds: duration,
    });

    const job: AnimationJob = {
      jobId,
      characterId,
      characterIds: Array.isArray(characterIds) ? characterIds.filter((id: unknown) => typeof id === 'string' && id.trim()) : undefined,
      duoKey: typeof duoKey === 'string' ? duoKey : undefined,
      sourceImageUrl,
      sourceImagePath: sourceImageUrl.replace('/api', ''),
      lastFrameImageUrl: lastFrameImageUrl?.trim() || undefined,
      lastFrameImagePath: lastFrameImageUrl?.trim()
        ? lastFrameImageUrl.trim().replace('/api', '')
        : undefined,
      prompt: resolvedPrompt.trim(),
      motionPrompt: resolvedPrompt.trim(),
      durationSeconds: duration,
      provider: providerName,
      status: created.status === 'done' ? 'processing' : created.status,
      externalJobId: created.externalJobId,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
    };

    saveAnimationJob(job);

    return NextResponse.json(
      {
        jobId: job.jobId,
        characterId: job.characterId,
        status: job.status,
      },
      { status: 202 }
    );
  } catch (e: any) {
    const status = Number(e?.status);
    const message = String(e?.message || 'Failed to create animation');

    if (status === 402 || /insufficient credit|api error 402/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'Replicate credit elfogyott. Toltse fel a billing egyenleget: https://replicate.com/account/billing#billing',
        },
        { status: 402 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
