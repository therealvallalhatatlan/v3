'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ImageInfo {
  filename: string;
  url: string;
  created: number;
  meta?: {
    characterId?: string;
    characterIds?: string[];
    duoKey?: string;
    aliasMap?: Record<string, string>;
    style?: string;
    styleIntensity?: number;
    camera?: string;
    location?: string;
    mood?: string;
    variant?: 'single' | 'A' | 'B';
  } | null;
}

interface AnimationJob {
  jobId: string;
  motionPrompt: string;
  durationSeconds: number;
  status: 'queued' | 'processing' | 'done' | 'failed' | 'canceled';
  videoUrl?: string;
  sourceImageUrl?: string;
  error?: string;
  createdAt: number;
}

const DURATION_OPTIONS = [
  { value: -1, label: 'Auto (AI decides)' },
  { value: 4, label: '4 seconds' },
  { value: 5, label: '5 seconds' },
  { value: 6, label: '6 seconds' },
  { value: 8, label: '8 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 12, label: '12 seconds' },
  { value: 15, label: '15 seconds' },
];

function statusBadgeClass(status: string) {
  switch (status) {
    case 'queued':    return 'bg-yellow-900 text-yellow-300';
    case 'processing': return 'bg-blue-900 text-blue-300 animate-pulse';
    case 'done':      return 'bg-green-900 text-green-300';
    case 'failed':    return 'bg-red-900 text-red-300';
    case 'canceled':  return 'bg-gray-700 text-gray-400';
    default:          return 'bg-gray-700 text-gray-400';
  }
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  characterId: string;
  images: ImageInfo[];
  initialSelectedUrl?: string;
  characterIds?: string[];
}

export default function AnimationPanel({ characterId, images, initialSelectedUrl, characterIds = [] }: Props) {
  const [selectedUrl, setSelectedUrl] = useState<string>(initialSelectedUrl || images[0]?.url || '');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [duration, setDuration] = useState<number>(-1);
  const [jobs, setJobs] = useState<AnimationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newlyCompletedIds, setNewlyCompletedIds] = useState<Set<string>>(new Set());
  // Track previous job statuses to detect transitions (undefined = not yet seen / initial load)
  const prevJobStatusRef = useRef<Map<string, string>>(new Map());

  // Sync when parent passes a new pre-selected URL (e.g. from Gallery "Animate" button)
  useEffect(() => {
    if (initialSelectedUrl) {
      setSelectedUrl(initialSelectedUrl);
    }
  }, [initialSelectedUrl]);

  // Auto-select first image when list loads for the first time
  useEffect(() => {
    if (!selectedUrl && images.length > 0) {
      setSelectedUrl(images[0].url);
    }
  }, [images, selectedUrl]);

  const loadJobs = useCallback(async () => {
    const res = await fetch(`/api/animations/${characterId}/list`);
    const data = await res.json();
    setJobs(data.jobs || []);
  }, [characterId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Detect job completion transitions → auto-download + highlight
  useEffect(() => {
    const prev = prevJobStatusRef.current;
    const justDone: AnimationJob[] = [];

    jobs.forEach((job) => {
      const prevStatus = prev.get(job.jobId);
      // Only fire when we've seen the job before (not on initial page load)
      if (prevStatus !== undefined && prevStatus !== 'done' && job.status === 'done' && job.videoUrl) {
        justDone.push(job);
      }
    });

    // Update the ref for next comparison
    const nextMap = new Map<string, string>();
    jobs.forEach((job) => nextMap.set(job.jobId, job.status));
    prevJobStatusRef.current = nextMap;

    if (justDone.length === 0) return;

    // Mark as newly completed (for highlight)
    setNewlyCompletedIds((prev) => {
      const next = new Set(prev);
      justDone.forEach((j) => next.add(j.jobId));
      return next;
    });

    // Auto-trigger download for each newly completed video
    justDone.forEach((job) => {
      const a = document.createElement('a');
      a.href = job.videoUrl!;
      a.download = `animation-${job.jobId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }, [jobs]);

  // Poll pending jobs every 5s
  useEffect(() => {
    const pending = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
    if (!pending.length) return;

    const interval = setInterval(async () => {
      try {
        const updated = await Promise.all(
          pending.map(async (job) => {
            try {
              const res = await fetch(`/api/animations/${characterId}/${job.jobId}/status`);
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return data.job || job;
              }
              const data = await res.json();
              return data.job || job;
            } catch {
              return job;
            }
          })
        );
        setJobs((prev) =>
          prev.map((job) => {
            const newer = updated.find((u) => u.jobId === job.jobId);
            return newer || job;
          })
        );
      } catch {
        // polling error — will retry next tick
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [jobs, characterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrl) {
      setError('Select a source image first.');
      return;
    }
    if (motionPrompt.trim().length < 4) {
      setError('Motion prompt is too short.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/animations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          characterIds: selectedImage?.meta?.characterIds || characterIds,
          duoKey: selectedImage?.meta?.duoKey,
          sourceImageUrl: selectedUrl,
          motionPrompt: motionPrompt.trim(),
          durationSeconds: duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create animation job');
      await loadJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      const res = await fetch(`/api/animations/${characterId}/${jobId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      setJobs((prev) => prev.map((j) => (j.jobId === jobId ? data.job : j)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedImage = images.find((img) => img.url === selectedUrl) ?? null;
  const activeJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const doneJobs = jobs.filter((j) => j.status === 'done' || j.status === 'failed' || j.status === 'canceled');

  return (
    <div className="space-y-6">

      {/* ── Step 1: Image Picker ── */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-2">
          1. Choose a source image
        </div>
        {images.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 bg-gray-800 rounded text-center">
            No generated images yet.{' '}
            <span className="text-gray-300 font-semibold">Generate</span> one first.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
            {images.map((img) => {
              const isSelected = img.url === selectedUrl;
              return (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setSelectedUrl(img.url)}
                  className={`relative rounded overflow-hidden border-2 transition-all focus:outline-none ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-400/40 scale-[1.03]'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  aria-label={`Select ${img.filename}`}
                  aria-pressed={isSelected}
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-16 object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-indigo-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold leading-none">
                      ✓
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-gray-300 px-1 py-0.5 truncate">
                    {img.meta?.style ?? relativeTime(img.created)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Step 2+3: Preview + Form side by side ── */}
      <div className="flex gap-4 items-start">

        {/* Selected preview */}
        {selectedImage && (
          <div className="flex-shrink-0 w-24">
            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Selected</div>
            <img
              src={selectedImage.url}
              alt="selected"
              className="w-24 h-24 object-cover rounded border border-indigo-500/40"
            />
            {selectedImage.meta?.style && (
              <div className="text-[10px] text-gray-400 mt-1 truncate">{selectedImage.meta.style}</div>
            )}
            {selectedImage.meta?.camera && (
              <div className="text-[10px] text-gray-500 truncate">{selectedImage.meta.camera}</div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              2. Motion prompt
            </label>
            <textarea
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm min-h-[80px] resize-none focus:outline-none focus:border-indigo-500"
              value={motionPrompt}
              onChange={(e) => setMotionPrompt(e.target.value)}
              placeholder="e.g. slow dolly-in, character turns head, coat and ears move gently in the wind"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              3. Duration
            </label>
            <select
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedUrl}
            className="w-full bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Submitting…
              </>
            ) : (
              '▶ Animate'
            )}
          </button>
        </form>
      </div>

      {/* ── In-Progress Jobs ── */}
      {activeJobs.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            In Progress
          </div>
          <div className="space-y-2">
            {activeJobs.map((job) => {
              const thumb = images.find((i) => i.url === job.sourceImageUrl);
              return (
                <div
                  key={job.jobId}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-start gap-3"
                >
                  {thumb && (
                    <img src={thumb.url} alt="source" className="w-12 h-12 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-[11px] text-gray-500">{relativeTime(job.createdAt)}</span>
                    </div>
                    <div className="text-xs text-gray-300 truncate">{job.motionPrompt}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Auto-refreshing every 5s…</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancel(job.jobId)}
                    className="text-[11px] text-gray-400 hover:text-red-400 border border-gray-600 hover:border-red-500 px-2 py-1 rounded transition-colors flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {doneJobs.length > 0 && (
        <div>
          <div className="text-sm font-semibold text-gray-300 mb-2">Results</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doneJobs.map((job) => {
              const isNew = newlyCompletedIds.has(job.jobId);
              return (
              <div
                key={job.jobId}
                className={`bg-gray-800 rounded-lg border overflow-hidden transition-all ${
                  isNew ? 'border-green-500 ring-2 ring-green-500/30' : 'border-gray-700'
                }`}
              >
                {isNew && (
                  <div className="bg-green-900/60 border-b border-green-700 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-green-300 text-xs font-semibold">✓ Videó kész! A letöltés megkezdődött.</span>
                    <button
                      type="button"
                      onClick={() => setNewlyCompletedIds((prev) => { const next = new Set(prev); next.delete(job.jobId); return next; })}
                      className="ml-auto text-green-500 hover:text-green-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {job.status === 'done' && job.videoUrl ? (
                  <video
                    controls
                    autoPlay={isNew}
                    className="w-full aspect-video bg-black"
                    src={job.videoUrl}
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    {job.sourceImageUrl && (
                      <img
                        src={job.sourceImageUrl}
                        alt="source"
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                      />
                    )}
                    <span className="relative text-gray-600 text-sm">
                      {job.status === 'failed' ? 'Failed' : 'Canceled'}
                    </span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(job.status)}`}>
                      {job.status}
                    </span>
                    <span className="text-[11px] text-gray-500">{relativeTime(job.createdAt)}</span>
                    {job.durationSeconds > 0 && (
                      <span className="text-[11px] text-gray-500">{job.durationSeconds}s</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-300 line-clamp-2 mb-1">{job.motionPrompt}</div>
                  {job.error && (
                    <div className="text-[11px] text-red-400 bg-red-950/40 rounded px-2 py-1 line-clamp-3">
                      {job.error}
                    </div>
                  )}
                  {job.status === 'done' && job.videoUrl && (
                    <a
                      href={job.videoUrl}
                      download={`animation-${job.jobId}.mp4`}
                      className="mt-2 inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                    >
                      ↓ Letöltés
                    </a>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {jobs.length === 0 && images.length > 0 && (
        <div className="text-xs text-gray-600 text-center py-6 border border-dashed border-gray-800 rounded-lg">
          No animation jobs yet. Select an image above and submit.
        </div>
      )}
    </div>
  );
}
