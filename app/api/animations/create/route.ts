import { NextRequest, NextResponse } from 'next/server';
import { getAnimationProvider } from '../../../../lib/animationProviders';
import { getCharacterById, saveAnimationJob } from '../../../../lib/storage';
import { AnimationJob } from '../../../../types/animation';
import { getStoragePath } from '../../../../lib/paths';
import fs from 'fs';
import path from 'path';

function normalizeDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === -1) return -1;
  const clamped = Math.max(4, Math.min(15, Math.round(parsed)));
  return clamped;
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
    const { characterId, characterIds, duoKey, sourceImageUrl, motionPrompt, durationSeconds } = body;

    if (!characterId || !sourceImageUrl || !motionPrompt) {
      return NextResponse.json(
        { error: 'characterId, sourceImageUrl and motionPrompt are required' },
        { status: 400 }
      );
    }

    if (typeof motionPrompt !== 'string' || motionPrompt.trim().length < 4) {
      return NextResponse.json({ error: 'motionPrompt is too short' }, { status: 400 });
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

    const created = await provider.createAnimation({
      sourceImageUrl: providerSourceImage,
      motionPrompt: motionPrompt.trim(),
      durationSeconds: duration,
    });

    const job: AnimationJob = {
      jobId,
      characterId,
      characterIds: Array.isArray(characterIds) ? characterIds.filter((id: unknown) => typeof id === 'string' && id.trim()) : undefined,
      duoKey: typeof duoKey === 'string' ? duoKey : undefined,
      sourceImageUrl,
      sourceImagePath: sourceImageUrl.replace('/api', ''),
      motionPrompt: motionPrompt.trim(),
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
