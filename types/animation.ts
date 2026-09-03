export type AnimationProvider = 'replicate';

export type AnimationStatus = 'queued' | 'processing' | 'done' | 'failed' | 'canceled';

export type AnimationJob = {
  jobId: string;
  characterId: string;
  characterIds?: string[];
  duoKey?: string;
  sourceImageUrl: string;
  sourceImagePath: string;
  motionPrompt: string;
  durationSeconds: number;
  provider: AnimationProvider;
  status: AnimationStatus;
  externalJobId?: string;
  localVideoPath?: string;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
};
