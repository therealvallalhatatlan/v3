import { NextRequest, NextResponse } from 'next/server';
import { getCharacterById } from '../../../lib/storage';
import { generateImage } from '../../../lib/gemini';
import { saveGeneratedImage } from '../../../lib/storage';
import { buildCharacterGroupKey } from '../../../lib/storage';
import { buildFinalPrompt, buildFinalPromptMulti } from '../../../lib/promptBuilder';
import { buildCharacterDNAFromCharacter } from '../../../lib/promptBuilder';
import { AspectRatio16x9, LocationPreset, SceneInput, ScenePackageInput, ShotTemplate } from '../../../types/prompt';
import { GeneratedImageMeta } from '../../../lib/storage';
import { normalizeToPromptEnglish } from '../../../lib/sceneMapper';
import { getPreset } from '../../../lib/presetStore';

function clampIntensity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 65;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function selectBalancedReferenceImages(characters: Array<{ imagePaths?: string[] }>, maxTotal = 6, maxPerCharacter = 3): string[] {
  const buckets = characters.map((character) => (character.imagePaths || []).slice(0, maxPerCharacter));
  const selected: string[] = [];
  let round = 0;
  while (selected.length < maxTotal) {
    let addedInRound = 0;
    for (const bucket of buckets) {
      if (selected.length >= maxTotal) break;
      if (bucket.length > round) { selected.push(bucket[round]); addedInRound += 1; }
    }
    if (addedInRound === 0) break;
    round += 1;
  }
  return selected;
}

const ALLOWED_SHOT_TEMPLATES: ShotTemplate[] = ['establishing-wide', 'medium-dialogue', 'closeup-emotion', 'over-shoulder', 'insert-detail', 'tracking-motion'];
const ALLOWED_ASPECT_RATIOS: AspectRatio16x9[] = ['landscape-16-9', 'portrait-9-16'];

function normalizeText(value: unknown, max = 600): string {
  const text = String(value || '').trim();
  return text ? text.slice(0, max) : '';
}

function safeSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function simpleHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function normalizeScenePackage(raw: any): ScenePackageInput | undefined {
  if (!raw || typeof raw !== 'object' || !raw.locationProfile || typeof raw.locationProfile !== 'object') return undefined;
  const presetRaw = String(raw.locationProfile.preset || '').trim() as LocationPreset;
  const shotTemplateRaw = String(raw.shotTemplate || '').trim() as ShotTemplate;
  if (!getPreset('location', presetRaw) || !ALLOWED_SHOT_TEMPLATES.includes(shotTemplateRaw)) return undefined;
  const locationProfile = {
    preset: presetRaw,
    detail: normalizeText(raw.locationProfile.detail, 600),
    geometry: normalizeText(raw.locationProfile.geometry, 600),
    lightingAndTime: normalizeText(raw.locationProfile.lightingAndTime, 400),
    paletteAndTexture: normalizeText(raw.locationProfile.paletteAndTexture, 400),
    fixedProps: normalizeText(raw.locationProfile.fixedProps, 500),
    cameraContinuity: normalizeText(raw.locationProfile.cameraContinuity, 400),
  };
  const continuity = {
    lockGeometry: Boolean(raw.continuity?.lockGeometry),
    lockLighting: Boolean(raw.continuity?.lockLighting),
    lockPalette: Boolean(raw.continuity?.lockPalette),
    lockProps: Boolean(raw.continuity?.lockProps),
    lockCameraRules: Boolean(raw.continuity?.lockCameraRules),
    notes: normalizeText(raw.continuity?.notes, 400) || undefined,
  };
  const sourceLanguage = String(raw.bilingualInput?.sourceLanguage || 'mixed').toLowerCase();
  const normalizedSourceLanguage = sourceLanguage === 'hu' || sourceLanguage === 'en' || sourceLanguage === 'mixed' ? sourceLanguage : 'mixed';
  const profileIdCandidate = normalizeText(raw.locationProfileId, 120);
  const profileId = profileIdCandidate || [safeSlug(presetRaw), safeSlug(locationProfile.detail || locationProfile.geometry || 'location')].filter(Boolean).join('--').slice(0, 120);
  return { locationProfileId: profileId || undefined, locationProfile, continuity, shotTemplate: shotTemplateRaw, bilingualInput: { sourceLanguage: normalizedSourceLanguage as 'hu' | 'en' | 'mixed' } };
}

function resolveLocationText(location: unknown, scenePackage?: ScenePackageInput): string {
  const legacyLocation = normalizeText(location, 800);
  if (scenePackage?.locationProfile?.detail) return scenePackage.locationProfile.detail;
  if (legacyLocation) return legacyLocation;
  const preset = String(scenePackage?.locationProfile?.preset || '');
  return getPreset('location', preset)?.prompt || 'cinematic scene location';
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { characterId, characterIds, aliasMap, location, mood, actionPrompt, camera, aspectRatio, style, styleIntensity, compareStyle, textOnly, scenePackage } = data;
    const normalizedCharacterIds = Array.from(new Set([...(Array.isArray(characterIds) ? characterIds : []), characterId].map((id) => String(id || '').trim()).filter(Boolean)));
    if (normalizedCharacterIds.length === 0) return NextResponse.json({ error: 'characterId or characterIds is required' }, { status: 400 });
    const loadedCharacters = normalizedCharacterIds.map((id) => getCharacterById(id));
    const missingIds = normalizedCharacterIds.filter((id, index) => !loadedCharacters[index]);
    if (missingIds.length > 0) return NextResponse.json({ error: `Character not found: ${missingIds.join(', ')}` }, { status: 404 });
    const charactersForGeneration = loadedCharacters.map((character) => textOnly ? { ...character!, imagePaths: [] } : character!);

    let cameraKey = String(camera || 'wide');
    if (cameraKey === 'close-up') cameraKey = 'closeup';
    if (!getPreset('camera', cameraKey)) cameraKey = 'wide';

    const requestedStyle = String(style || '').trim();
    const styleKey = getPreset('style', requestedStyle) ? requestedStyle : 'gritty';
    const requestedCompareStyle = String(compareStyle || '').trim();
    const compareStyleKey = getPreset('style', requestedCompareStyle) ? requestedCompareStyle : null;
    const aspectRatioKey = ALLOWED_ASPECT_RATIOS.includes(aspectRatio as AspectRatio16x9) ? aspectRatio as AspectRatio16x9 : 'landscape-16-9';
    const intensity = clampIntensity(styleIntensity);
    const normalizedScenePackage = normalizeScenePackage(scenePackage);
    const resolvedLocation = resolveLocationText(location, normalizedScenePackage);

    const castAliases = charactersForGeneration.map((character, index) => {
      const explicit = aliasMap && typeof aliasMap === 'object' ? String(aliasMap[character.id] || '').trim() : '';
      if (explicit) return explicit;
      return buildCharacterDNAFromCharacter(character, undefined, index).alias || `C${index + 1}`;
    });

    const scene: SceneInput = {
      location: resolvedLocation,
      mood: normalizeToPromptEnglish(String(mood || '').trim()),
      actionPrompt: typeof actionPrompt === 'string' ? actionPrompt.trim() : undefined,
      castAliases,
      scenePackage: normalizedScenePackage,
      locationProfileId: normalizedScenePackage?.locationProfileId,
      aspectRatio: aspectRatioKey,
      style: styleKey,
      styleIntensity: intensity,
      camera: cameraKey,
    };

    const locationFingerprintSource = normalizedScenePackage
      ? JSON.stringify({ profile: normalizedScenePackage.locationProfile, continuity: normalizedScenePackage.continuity, shotTemplate: normalizedScenePackage.shotTemplate })
      : resolvedLocation;
    const locationFingerprint = `loc-${simpleHash(locationFingerprintSource)}`;
    scene.locationFingerprint = locationFingerprint;

    const characterDNAList = charactersForGeneration.map((character, index) => {
      const explicitAlias = aliasMap && typeof aliasMap === 'object' ? String(aliasMap[character.id] || '').trim() : '';
      return buildCharacterDNAFromCharacter(character, explicitAlias, index);
    });
    const isMultiCharacter = characterDNAList.length > 1;
    const prompt = isMultiCharacter ? buildFinalPromptMulti(characterDNAList, scene) : buildFinalPrompt(characterDNAList[0], scene);
    const referenceImages = selectBalancedReferenceImages(charactersForGeneration);
    const primaryCharacterId = normalizedCharacterIds[0];
    const groupKey = buildCharacterGroupKey(normalizedCharacterIds);
    const duoFolderId = isMultiCharacter ? `duo--${groupKey}` : null;

    const saveGeneratedForTargets = async (imageBase64: string, metadata: Omit<GeneratedImageMeta, 'characterId'>): Promise<string | null> => {
      const targetIds = [...normalizedCharacterIds, ...(duoFolderId ? [duoFolderId] : [])];
      let primaryPath: string | null = null;
      for (const targetId of targetIds) {
        const storedPath = await saveGeneratedImage(imageBase64, targetId, { ...metadata, characterId: targetId });
        if (targetId === primaryCharacterId) primaryPath = `/api${storedPath}`;
      }
      return primaryPath;
    };

    const geminiAspectRatio = aspectRatioKey === 'portrait-9-16' ? '9:16' : '16:9';
    const imageBase64 = await generateImage(prompt, referenceImages, geminiAspectRatio);
    let imagePath = null;
    if (imageBase64) {
      imagePath = await saveGeneratedForTargets(imageBase64, {
        characterIds: normalizedCharacterIds, duoKey: duoFolderId || undefined,
        aliasMap: aliasMap && typeof aliasMap === 'object' ? aliasMap : undefined,
        location: resolvedLocation,
        mood: normalizeToPromptEnglish(String(mood || '').trim()),
        camera: cameraKey,
        aspectRatio: aspectRatioKey,
        style: styleKey,
        styleIntensity: intensity,
        locationProfileId: normalizedScenePackage?.locationProfileId,
        locationFingerprint,
        shotTemplateId: normalizedScenePackage?.shotTemplate,
        continuityNotes: normalizedScenePackage?.continuity?.notes,
        prompt,
        variant: compareStyleKey ? 'A' : 'single',
        createdAt: Date.now(),
      });
    }

    if (compareStyleKey) {
      const compareScene: SceneInput = { ...scene, style: compareStyleKey };
      const comparePrompt = isMultiCharacter ? buildFinalPromptMulti(characterDNAList, compareScene) : buildFinalPrompt(characterDNAList[0], compareScene);
      const imageBase64B = await generateImage(comparePrompt, referenceImages, geminiAspectRatio);
      let imagePathB = null;
      if (imageBase64B) {
        imagePathB = await saveGeneratedForTargets(imageBase64B, {
          characterIds: normalizedCharacterIds, duoKey: duoFolderId || undefined,
          aliasMap: aliasMap && typeof aliasMap === 'object' ? aliasMap : undefined,
          location: resolvedLocation, mood: normalizeToPromptEnglish(String(mood || '').trim()), camera: cameraKey,
          aspectRatio: aspectRatioKey, style: compareStyleKey, styleIntensity: intensity,
          locationProfileId: normalizedScenePackage?.locationProfileId, locationFingerprint,
          shotTemplateId: normalizedScenePackage?.shotTemplate, continuityNotes: normalizedScenePackage?.continuity?.notes,
          prompt: comparePrompt, variant: 'B', createdAt: Date.now(),
        });
      }
      return NextResponse.json({ ok: true, imagePath, imagePathB, image: imagePath, compareImage: imagePathB, prompt, comparePrompt, characterIds: normalizedCharacterIds, aspectRatio: aspectRatioKey, style: styleKey, compareStyle: compareStyleKey, locationProfileId: normalizedScenePackage?.locationProfileId, locationFingerprint });
    }

    return NextResponse.json({ ok: true, imagePath, image: imagePath, prompt, characterIds: normalizedCharacterIds, aspectRatio: aspectRatioKey, style: styleKey, locationProfileId: normalizedScenePackage?.locationProfileId, locationFingerprint });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error?.message || 'Generation failed' }, { status: 500 });
  }
}
