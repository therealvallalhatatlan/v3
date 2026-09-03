import { NextRequest, NextResponse } from 'next/server';
import { getStoragePath } from '../../../../../lib/paths';
import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

type ImageMeta = {
  characterId?: string;
  characterIds?: string[];
  duoKey?: string;
  aliasMap?: Record<string, string>;
  style?: string;
  styleIntensity?: number;
  camera?: string;
  aspectRatio?: 'landscape-16-9' | 'portrait-9-16';
  location?: string;
  mood?: string;
  locationProfileId?: string;
  locationFingerprint?: string;
  shotTemplateId?: string;
  continuityNotes?: string;
  variant?: 'single' | 'A' | 'B';
  createdAt?: number;
};

export async function GET(req: NextRequest, { params }: { params: { characterId: string } }) {
  const { characterId } = params;
  const duoWith = req.nextUrl.searchParams.get('duoWith')?.trim();
  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
  }

  const rootPath = getStoragePath('generated');
  const requestedSet = new Set([characterId, ...(duoWith ? [duoWith] : [])]);
  const imageMap = new Map<string, {
    filename: string;
    url: string;
    created: number;
    meta: ImageMeta | null;
  }>();

  const collectImagesFromDir = (folderId: string) => {
    const dirPath = getStoragePath('generated', folderId);
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath).filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()));
    for (const fileName of entries) {
      const filePath = path.join(dirPath, fileName);
      const created = fs.statSync(filePath).birthtimeMs;
      const parsed = path.parse(filePath);
      const metaFilePath = path.join(parsed.dir, `${parsed.name}.json`);
      let meta: ImageMeta | null = null;

      if (fs.existsSync(metaFilePath)) {
        try {
          const raw = fs.readFileSync(metaFilePath, 'utf-8');
          meta = JSON.parse(raw) as ImageMeta;
        } catch {
          meta = null;
        }
      }

      const metaCharacterIds = new Set((meta?.characterIds || []).map((id) => String(id)));
      const includeByMeta = metaCharacterIds.has(characterId)
        && (!duoWith || metaCharacterIds.has(duoWith));
      const includeByFolder = folderId === characterId;

      if (!includeByMeta && !includeByFolder) {
        continue;
      }

      const url = `/api/generated/${folderId}/${fileName}`;
      const dedupeKey = `${meta?.duoKey || 'single'}::${fileName}`;
      const existing = imageMap.get(dedupeKey);

      if (!existing || created > existing.created) {
        imageMap.set(dedupeKey, {
          filename: fileName,
          url,
          created,
          meta,
        });
      }
    }
  };

  collectImagesFromDir(characterId);

  if (fs.existsSync(rootPath)) {
    const allFolders = fs.readdirSync(rootPath).filter((name) => {
      const full = path.join(rootPath, name);
      return fs.statSync(full).isDirectory();
    });

    for (const folderId of allFolders) {
      if (requestedSet.has(folderId)) continue;
      if (!folderId.startsWith('duo--')) continue;
      collectImagesFromDir(folderId);
    }
  }

  const files = Array.from(imageMap.values()).sort((a, b) => b.created - a.created);
  return NextResponse.json({ images: files });
}
