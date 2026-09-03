export type ProviderCreateAnimationInput = {
  sourceImageUrl: string;
  motionPrompt: string;
  durationSeconds: number;
};

export type ProviderCreateAnimationResult = {
  externalJobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed' | 'canceled';
};

export type ProviderAnimationStatusResult = {
  status: 'queued' | 'processing' | 'done' | 'failed' | 'canceled';
  outputVideoUrl?: string;
  error?: string;
};

export interface AnimationProviderClient {
  createAnimation(input: ProviderCreateAnimationInput): Promise<ProviderCreateAnimationResult>;
  getAnimationStatus(externalJobId: string): Promise<ProviderAnimationStatusResult>;
  cancelAnimation(externalJobId: string): Promise<void>;
}
