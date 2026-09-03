import {
  AnimationProviderClient,
  ProviderAnimationStatusResult,
  ProviderCreateAnimationInput,
  ProviderCreateAnimationResult,
} from './types';

function mapReplicateStatus(status: string): ProviderAnimationStatusResult['status'] {
  if (status === 'starting') return 'queued';
  if (status === 'processing') return 'processing';
  if (status === 'succeeded') return 'done';
  if (status === 'failed') return 'failed';
  if (status === 'canceled') return 'canceled';
  return 'processing';
}

function pickOutputVideoUrl(output: unknown): string | undefined {
  if (typeof output === 'string') {
    return output;
  }
  if (Array.isArray(output)) {
    const firstVideo = output.find((item) => typeof item === 'string' && item.endsWith('.mp4'));
    if (typeof firstVideo === 'string') return firstVideo;
    const firstString = output.find((item) => typeof item === 'string');
    if (typeof firstString === 'string') return firstString;
  }
  return undefined;
}

export class ReplicateAnimationProvider implements AnimationProviderClient {
  private readonly apiToken: string;
  private readonly modelReference: string;
  private readonly apiBaseUrl: string;
  private readonly imageKey: string;
  private readonly promptKey: string;
  private readonly durationKey: string;

  constructor() {
    this.apiToken = process.env.REPLICATE_API_TOKEN || '';
    this.modelReference = process.env.REPLICATE_VIDEO_MODEL_VERSION || '';
    this.apiBaseUrl = process.env.REPLICATE_API_BASE_URL || 'https://api.replicate.com/v1';
    this.imageKey = process.env.REPLICATE_INPUT_IMAGE_KEY || 'image';
    this.promptKey = process.env.REPLICATE_INPUT_PROMPT_KEY || 'prompt';
    this.durationKey = process.env.REPLICATE_INPUT_DURATION_KEY || 'duration';

    if (!this.apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not set');
    }
    if (!this.modelReference) {
      throw new Error('REPLICATE_VIDEO_MODEL_VERSION is not set');
    }
  }

  private isModelSlugReference(value: string): boolean {
    return value.includes('/');
  }

  private async request(path: string, init: RequestInit): Promise<any> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.apiToken}`,
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const rawText = await response.text();
      let detail = rawText;
      try {
        const parsed = JSON.parse(rawText);
        detail = parsed.detail || parsed.title || rawText;
      } catch {
        // keep rawText as detail
      }

      const err = new Error(`Replicate API error ${response.status}: ${detail}`) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  async createAnimation(input: ProviderCreateAnimationInput): Promise<ProviderCreateAnimationResult> {
    const inputPayload = {
      [this.imageKey]: input.sourceImageUrl,
      [this.promptKey]: input.motionPrompt,
      [this.durationKey]: input.durationSeconds,
    };

    const isSlug = this.isModelSlugReference(this.modelReference);
    const payload = isSlug
      ? { input: inputPayload }
      : { version: this.modelReference, input: inputPayload };

    const createPath = isSlug
      ? (() => {
          const [owner, name] = this.modelReference.split('/');
          if (!owner || !name) {
            throw new Error('Invalid model slug in REPLICATE_VIDEO_MODEL_VERSION. Expected owner/name.');
          }
          return `/models/${owner}/${name}/predictions`;
        })()
      : '/predictions';

    const data = await this.request(createPath, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      externalJobId: data.id,
      status: mapReplicateStatus(data.status),
    };
  }

  async getAnimationStatus(externalJobId: string): Promise<ProviderAnimationStatusResult> {
    const data = await this.request(`/predictions/${externalJobId}`, {
      method: 'GET',
    });

    return {
      status: mapReplicateStatus(data.status),
      outputVideoUrl: pickOutputVideoUrl(data.output),
      error: data.error || undefined,
    };
  }

  async cancelAnimation(externalJobId: string): Promise<void> {
    await this.request(`/predictions/${externalJobId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}
