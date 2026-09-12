import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ensureDir, readJSON, writeJSON } from './fileUtils';
import { getStoragePath, initStorage } from './paths';
import { AnimationJob } from '../types/animation';

export type Character = {
  id: string;
  name: string;
  description: string;
  traits: string[];
  imagePaths: string[];
  createdAt: number;
};

const CHAR_PATH = 'characters.json';
const IMAGE_DIR = 'images';
const GENERATED_DIR = 'generated';
const ANIMATION_DIR = 'animations';

export type GeneratedImageMeta = {
  characterId: string;
  characterIds?: string[];
  duoKey?: string;
  aliasMap?: Record<string, string>;
  location: string;
  mood: string;
  camera: string;
  aspectRatio?: 'landscape-16-9' | 'portrait-9-16';
  style: string;
  styleIntensity: number;
  locationProfileId?: string;
  locationFingerprint?: string;
  shotTemplateId?: string;
  continuityNotes?: string;
  prompt?: string;
  variant?: 'single' | 'A' | 'B';
  createdAt: number;
};

function detectImageExtension(buffer: Buffer): string {
  if (buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47) {
    return '.png';
  }
  if (buffer.length >= 3
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff) {
    return '.jpg';
  }
  if (buffer.length >= 12
    && buffer.slice(0, 4).toString('ascii') === 'RIFF'
    && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return '.webp';
  }
  if (buffer.length >= 3
    && buffer[0] === 0x47
    && buffer[1] === 0x49
    && buffer[2] === 0x46) {
    return '.gif';
  }
  return '.png';
}

function parseDataUrlToBuffer(base64OrDataUrl: string): { buffer: Buffer; extension: string } {
  const text = String(base64OrDataUrl || '').trim();
  if (!text) {
    throw new Error('Generated image payload is empty');
  }

  const dataUrlMatch = text.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1].toLowerCase();
    const rawBase64 = dataUrlMatch[2];
    const buffer = Buffer.from(rawBase64, 'base64');
    const extensionMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const extension = extensionMap[mimeType] || detectImageExtension(buffer);
    return { buffer, extension };
  }

  const buffer = Buffer.from(text, 'base64');
  if (!buffer.length) {
    throw new Error('Failed to decode generated image base64 payload');
  }
  return {
    buffer,
    extension: detectImageExtension(buffer),
  };
}

async function normalizeGeneratedImageAspect(
  buffer: Buffer,
  extension: string,
  aspectRatio?: GeneratedImageMeta['aspectRatio']
): Promise<{ buffer: Buffer; extension: string }> {
  if (!aspectRatio) {
    return { buffer, extension };
  }

  const target = aspectRatio === 'portrait-9-16'
    ? { width: 864, height: 1536 }
    : { width: 1536, height: 864 };

  try {
    const img = sharp(buffer, { failOn: 'none' });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) {
      return { buffer, extension };
    }

    const currentRatio = meta.width / meta.height;
    const targetRatio = target.width / target.height;
    const ratioDiff = Math.abs(currentRatio - targetRatio);

    if (ratioDiff < 0.002 && meta.width === target.width && meta.height === target.height) {
      return { buffer, extension };
    }

    const outFormat = extension === '.jpg'
      ? 'jpeg'
      : extension === '.webp'
        ? 'webp'
        : 'png';

    const normalized = await img
      .resize(target.width, target.height, {
        fit: 'cover',
        position: 'centre',
      })
      .toFormat(outFormat)
      .toBuffer();

    const outExtension = outFormat === 'jpeg'
      ? '.jpg'
      : outFormat === 'webp'
        ? '.webp'
        : '.png';

    return { buffer: normalized, extension: outExtension };
  } catch {
    return { buffer, extension };
  }
}

export function buildCharacterGroupKey(characterIds: string[]): string {
  const normalized = Array.from(
    new Set(characterIds.map((id) => String(id || '').trim()).filter(Boolean))
  ).sort();
  return normalized.join('__');
}

export function getAllCharacters(): Character[] {
  initStorage();
  return readJSON<Character[]>(CHAR_PATH);
}

export function getCharacterById(id: string): Character | undefined {
  return getAllCharacters().find((c) => c.id === id);
}

export function saveCharacter(character: Character): void {
  initStorage();
  const chars = getAllCharacters();
  chars.push(character);
  writeJSON(CHAR_PATH, chars);
}

export function updateCharacter(character: Character): void {
  initStorage();
  let chars = getAllCharacters();
  chars = chars.map((c) => (c.id === character.id ? character : c));
  writeJSON(CHAR_PATH, chars);
}

export function deleteCharacter(id: string): void {
  initStorage();
  const chars = getAllCharacters();
  writeJSON(CHAR_PATH, chars.filter((c) => c.id !== id));

  // Remove character-scoped source images and generated media as well.
  for (const baseDir of [IMAGE_DIR, GENERATED_DIR]) {
    const characterDir = getStoragePath(path.join(baseDir, id));
    if (fs.existsSync(characterDir)) {
      fs.rmSync(characterDir, { recursive: true, force: true });
    }
  }
}

export function listGeneratedImages(characterId: string): string[] {
  const dir = path.join(GENERATED_DIR, characterId);
  ensureDir(dir);
  const fullDir = getStoragePath(dir);
  if (!fs.existsSync(fullDir)) return [];
  return fs.readdirSync(fullDir).map((f) => path.posix.join('/', dir, f));
}

export async function saveCharacterImages(files: File[], characterId: string): Promise<string[]> {
  const dir = path.join(IMAGE_DIR, characterId);
  ensureDir(dir);
  const savedPaths: string[] = [];
  for (const file of files) {
    const ext = path.extname(file.name) || '.png';
    const ts = Date.now();
    const fileName = `${ts}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}${ext}`;
    const relPath = path.join(dir, fileName);
    const fullPath = getStoragePath(relPath);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(fullPath, Buffer.from(arrayBuffer));
    savedPaths.push(path.posix.join('/', dir, fileName));
  }
  return savedPaths;
}

export async function saveGeneratedImage(base64: string, characterId: string, meta?: GeneratedImageMeta): Promise<string> {
  const dir = path.join(GENERATED_DIR, characterId);
  ensureDir(dir);
  const ts = Date.now();

  let outputBuffer: Buffer;
  let extension = '.png';
  try {
    const parsed = parseDataUrlToBuffer(base64);
    outputBuffer = parsed.buffer;
    extension = parsed.extension;

    const normalized = await normalizeGeneratedImageAspect(outputBuffer, extension, meta?.aspectRatio);
    outputBuffer = normalized.buffer;
    extension = normalized.extension;
  } catch (error: any) {
    throw new Error(`Failed to save generated image without postprocess: ${error?.message || 'unknown error'}`);
  }

  const fileName = `${ts}${extension}`;
  const relPath = path.join(dir, fileName);
  const fullPath = getStoragePath(relPath);

  fs.writeFileSync(fullPath, outputBuffer);

  if (meta) {
    const parsedPath = path.parse(fullPath);
    const metaPath = path.join(parsedPath.dir, `${parsedPath.name}.json`);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  }

  return path.posix.join('/', dir, fileName);
}

function getAnimationDir(characterId: string): string {
  return path.join(GENERATED_DIR, characterId, ANIMATION_DIR);
}

function getAnimationJobPath(characterId: string, jobId: string): string {
  return path.join(getAnimationDir(characterId), `${jobId}.json`);
}

function getAnimationVideoPath(characterId: string, jobId: string): string {
  return path.join(getAnimationDir(characterId), `${jobId}.mp4`);
}

export function saveAnimationJob(job: AnimationJob): void {
  const dir = getAnimationDir(job.characterId);
  ensureDir(dir);
  const fullPath = getStoragePath(getAnimationJobPath(job.characterId, job.jobId));
  fs.writeFileSync(fullPath, JSON.stringify(job, null, 2), 'utf-8');
}

export function getAnimationJob(characterId: string, jobId: string): AnimationJob | null {
  const fullPath = getStoragePath(getAnimationJobPath(characterId, jobId));
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(raw) as AnimationJob;
  } catch {
    return null;
  }
}

export function updateAnimationJob(
  characterId: string,
  jobId: string,
  updates: Partial<AnimationJob>
): AnimationJob | null {
  const current = getAnimationJob(characterId, jobId);
  if (!current) {
    return null;
  }
  const next: AnimationJob = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  };
  saveAnimationJob(next);
  return next;
}

export function listAnimationJobs(characterId: string): AnimationJob[] {
  const dir = getStoragePath(getAnimationDir(characterId));
  if (!fs.existsSync(dir)) {
    return [];
  }
  const jobs = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      try {
        const raw = fs.readFileSync(path.join(dir, name), 'utf-8');
        return JSON.parse(raw) as AnimationJob;
      } catch {
        return null;
      }
    })
    .filter((job): job is AnimationJob => Boolean(job))
    .sort((a, b) => b.createdAt - a.createdAt);

  return jobs;
}

export function saveAnimationVideo(characterId: string, jobId: string, videoBuffer: Buffer): string {
  const dir = getAnimationDir(characterId);
  ensureDir(dir);
  const relPath = getAnimationVideoPath(characterId, jobId);
  const fullPath = getStoragePath(relPath);
  fs.writeFileSync(fullPath, videoBuffer);
  return path.posix.join('/', relPath);
}
