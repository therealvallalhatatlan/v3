'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ImageInfo } from './AnimationPanel';
import type { Character } from '../../../types';
import type { AspectRatio16x9, LocationPreset, ShotTemplate } from '../../../types/prompt';

type PresetOption = { value: string; label: string };

const DEFAULT_CAMERA_OPTIONS: PresetOption[] = [
  { value: 'close-up', label: 'Close-up' },
  { value: 'wide', label: 'Wide' },
  { value: 'fisheye', label: 'Fisheye' },
  { value: 'handheld', label: 'Handheld (Cinematic Realism)' },
  { value: 'dutch', label: 'Dutch Angle (Tension)' },
  { value: 'birdseye', label: "Bird's-Eye (Top-Down)" },
  { value: 'overtheshoulder', label: 'Over-the-Shoulder (POV Drama)' },
  { value: 'wormseye', label: "Worm's-Eye (Heroic Low Angle)" },
  { value: 'speedcam1999', label: 'Rendőrségi Traffipax 1999 (Éjszakai)' },
  { value: 'security-cam', label: 'Security Camera (Fixed Surveillance)' },
  { value: 'telephoto-stakeout', label: 'Telephoto Stakeout (Long-Lens Surveillance)' },
  { value: 'cctv-distorted', label: 'CCTV Fisheye Distortion (Surveillance Archive)' },
  { value: 'reflection-pov', label: 'Reflection POV (Mirror/Glass Subjective)' },
  { value: 'macro-forensic', label: 'Macro Forensic Detail (Extreme Close-Up)' },
  { value: 'pov-dashboard', label: 'Dashboard POV (In-Vehicle First-Person)' },
];

const DEFAULT_STYLE_OPTIONS: PresetOption[] = [
  { value: 'gritty', label: 'Gritty Underground (Default)' },
  { value: 'noir-bw', label: 'Black and White Film Noir' },
  { value: 'vhs-glitch', label: 'Glitch VHS Analog Camera' },
  { value: 'neo-noir-neon', label: 'Neo Noir Neon' },
  { value: 'dreamy-ethereal', label: 'Dreamy Ethereal' },
  { value: 'graphic-novel', label: 'Graphic Novel' },
  { value: 'police-speed-photo', label: 'Police Speeding Camera Photo' },
];

const DEFAULT_LOCATION_OPTIONS: PresetOption[] = [
  { value: '', label: 'Üres preset' },
  { value: 'urban-street', label: 'Urban Street' },
  { value: 'apartment', label: 'Apartment Interior' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'subway', label: 'Subway Station' },
  { value: 'forest', label: 'Forest' },
  { value: 'industrial-yard', label: 'Industrial Yard' },
  { value: 'night-highway', label: 'Night Highway' },
  { value: 'interrogation-room', label: 'Interrogation Room' },
  { value: 'budai', label: 'Budai Family Room (Old-World Interior)' },
  { value: 'bevasarlokozpont', label: 'Budapest Mall Clothing Store (1999)' },
  { value: 'vaulted-cellar-server-room', label: 'Vaulted Brick Cellar / Retro Server Room' },
  { value: 'mcdonalds-east-eu-2000', label: 'McDonalds East Europe (Late 90s / 2000)' },
  { value: 'land-rover-interior-pov', label: 'Old Land Rover Interior (POV)' },
  { value: 'white-studio-sofa', label: 'White Studio / Large Sofa' },
  { value: 'hotel-courtyard-pool-cocktail-bar', label: 'Szálloda belső udvara úszómedencével és koktélbárral' },
];

const SHOT_TEMPLATE_OPTIONS: Array<{ value: ShotTemplate; label: string }> = [
  { value: 'establishing-wide', label: 'Establishing Wide' },
  { value: 'medium-dialogue', label: 'Medium Dialogue' },
  { value: 'closeup-emotion', label: 'Close-up Emotion' },
  { value: 'over-shoulder', label: 'Over-Shoulder' },
  { value: 'insert-detail', label: 'Insert Detail' },
  { value: 'tracking-motion', label: 'Tracking Motion' },
];

const ASPECT_RATIO_OPTIONS: Array<{ value: AspectRatio16x9; label: string }> = [
  { value: 'landscape-16-9', label: 'Fekvő 16:9' },
  { value: 'portrait-9-16', label: 'Álló 9:16' },
];

const LOCATION_HISTORY_KEY = 'illustration.location.history';
const MOOD_HISTORY_KEY = 'illustration.mood.history';
const GENERATE_FORM_VERSION = 'v1';
const CHAR_FORM_KEY_PREFIX = `illustration.generate.form.${GENERATE_FORM_VERSION}.character`;
const CHAR_PRESETS_KEY_PREFIX = `illustration.generate.presets.${GENERATE_FORM_VERSION}.character`;
const GLOBAL_PRESETS_KEY = `illustration.generate.presets.${GENERATE_FORM_VERSION}.global`;
const GLOBAL_DEFAULT_PRESET_KEY = `illustration.generate.defaultPreset.${GENERATE_FORM_VERSION}.global`;

 type GenerateFormState = {
  location: string;
  mood: string;
  locationPreset: string;
  locationGeometry: string;
  locationLighting: string;
  locationPalette: string;
  locationProps: string;
  locationCameraContinuity: string;
  shotTemplate: ShotTemplate;
  lockGeometry: boolean;
  lockLighting: boolean;
  lockPalette: boolean;
  lockProps: boolean;
  lockCameraRules: boolean;
  continuityNotes: string;
  actionPrompt: string;
  extraCharacterIds: string[];
  aliasMap: Record<string, string>;
  camera: string;
  aspectRatio: AspectRatio16x9;
  style: string;
  styleIntensity: number;
  compareMode: boolean;
  compareStyle: string;
};

type GenerateFormPreset = { id: string; name: string; updatedAt: number; data: GenerateFormState };
type Tab = 'generate' | 'animate' | 'gallery';

type PresetCatalogResponse = {
  presets?: {
    location?: PresetOption[];
    camera?: PresetOption[];
    style?: PresetOption[];
  };
};

const Gallery = dynamic(() => import('./Gallery'), { ssr: false });
const AnimationPanel = dynamic(() => import('./AnimationPanel'), { ssr: false });

function mergeOptions(defaults: PresetOption[], incoming: PresetOption[] | undefined): PresetOption[] {
  const map = new Map(defaults.map((item) => [item.value, item]));
  for (const item of incoming || []) {
    if (!item?.value) continue;
    map.set(item.value, { value: item.value, label: item.label || item.value });
  }
  return Array.from(map.values());
}

export default function CharacterDetailPage() {
  const params = useParams();
  const primaryCharacterId = Array.isArray(params.id) ? params.id[0] : String(params.id || '');
  const [character, setCharacter] = useState<Character | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'paid' | 'admin'>('free');
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [cameraOptions, setCameraOptions] = useState(DEFAULT_CAMERA_OPTIONS);
  const [styleOptions, setStyleOptions] = useState(DEFAULT_STYLE_OPTIONS);
  const [locationPresetOptions, setLocationPresetOptions] = useState(DEFAULT_LOCATION_OPTIONS);

  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('');
  const [locationPreset, setLocationPreset] = useState<LocationPreset>('urban-street');
  const [locationGeometry, setLocationGeometry] = useState('');
  const [locationLighting, setLocationLighting] = useState('');
  const [locationPalette, setLocationPalette] = useState('');
  const [locationProps, setLocationProps] = useState('');
  const [locationCameraContinuity, setLocationCameraContinuity] = useState('');
  const [shotTemplate, setShotTemplate] = useState<ShotTemplate>('establishing-wide');
  const [lockGeometry, setLockGeometry] = useState(true);
  const [lockLighting, setLockLighting] = useState(true);
  const [lockPalette, setLockPalette] = useState(true);
  const [lockProps, setLockProps] = useState(true);
  const [lockCameraRules, setLockCameraRules] = useState(true);
  const [continuityNotes, setContinuityNotes] = useState('');
  const [actionPrompt, setActionPrompt] = useState('');
  const [extraCharacterIds, setExtraCharacterIds] = useState<string[]>([]);
  const [pendingCharacterId, setPendingCharacterId] = useState('');
  const [aliasMap, setAliasMap] = useState<Record<string, string>>({});
  const [locationHistory, setLocationHistory] = useState<string[]>([]);
  const [moodHistory, setMoodHistory] = useState<string[]>([]);
  const [camera, setCamera] = useState('close-up');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio16x9>('landscape-16-9');
  const [style, setStyle] = useState('gritty');
  const [styleIntensity, setStyleIntensity] = useState(65);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStyle, setCompareStyle] = useState('noir-bw');

  const [presetName, setPresetName] = useState('');
  const [characterPresets, setCharacterPresets] = useState<GenerateFormPreset[]>([]);
  const [globalPresets, setGlobalPresets] = useState<GenerateFormPreset[]>([]);
  const [selectedCharacterPresetId, setSelectedCharacterPresetId] = useState('');
  const [selectedGlobalPresetId, setSelectedGlobalPresetId] = useState('');
  const [storageInfo, setStorageInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<ImageInfo[]>([]);
  const [animatePreselectedUrl, setAnimatePreselectedUrl] = useState('');
  const [generatedReferenceImages, setGeneratedReferenceImages] = useState<Array<{ id: string; path: string; url: string; created: number }>>([]);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [referenceError, setReferenceError] = useState('');

  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCharacterFormKey = (id: string) => `${CHAR_FORM_KEY_PREFIX}.${id}`;
  const getCharacterPresetsKey = (id: string) => `${CHAR_PRESETS_KEY_PREFIX}.${id}`;

  const parseStoredJson = <T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  };

  const createFormSnapshot = (): GenerateFormState => ({
    location, mood, locationPreset, locationGeometry, locationLighting, locationPalette, locationProps,
    locationCameraContinuity, shotTemplate, lockGeometry, lockLighting, lockPalette, lockProps, lockCameraRules,
    continuityNotes, actionPrompt, extraCharacterIds, aliasMap, camera, aspectRatio, style, styleIntensity,
    compareMode, compareStyle,
  });

  const applyFormSnapshot = (snapshot: Partial<GenerateFormState>) => {
    if (typeof snapshot.location === 'string') setLocation(snapshot.location);
    if (typeof snapshot.mood === 'string') setMood(snapshot.mood);
    if (typeof snapshot.locationPreset === 'string') setLocationPreset(snapshot.locationPreset);
    if (typeof snapshot.locationGeometry === 'string') setLocationGeometry(snapshot.locationGeometry);
    if (typeof snapshot.locationLighting === 'string') setLocationLighting(snapshot.locationLighting);
    if (typeof snapshot.locationPalette === 'string') setLocationPalette(snapshot.locationPalette);
    if (typeof snapshot.locationProps === 'string') setLocationProps(snapshot.locationProps);
    if (typeof snapshot.locationCameraContinuity === 'string') setLocationCameraContinuity(snapshot.locationCameraContinuity);
    if (typeof snapshot.shotTemplate === 'string') setShotTemplate(snapshot.shotTemplate as ShotTemplate);
    if (typeof snapshot.lockGeometry === 'boolean') setLockGeometry(snapshot.lockGeometry);
    if (typeof snapshot.lockLighting === 'boolean') setLockLighting(snapshot.lockLighting);
    if (typeof snapshot.lockPalette === 'boolean') setLockPalette(snapshot.lockPalette);
    if (typeof snapshot.lockProps === 'boolean') setLockProps(snapshot.lockProps);
    if (typeof snapshot.lockCameraRules === 'boolean') setLockCameraRules(snapshot.lockCameraRules);
    if (typeof snapshot.continuityNotes === 'string') setContinuityNotes(snapshot.continuityNotes);
    if (typeof snapshot.actionPrompt === 'string') setActionPrompt(snapshot.actionPrompt);
    if (Array.isArray(snapshot.extraCharacterIds)) setExtraCharacterIds(snapshot.extraCharacterIds.filter(Boolean));
    if (snapshot.aliasMap && typeof snapshot.aliasMap === 'object') setAliasMap(snapshot.aliasMap);
    if (typeof snapshot.camera === 'string') setCamera(snapshot.camera);
    if (typeof snapshot.aspectRatio === 'string') setAspectRatio(snapshot.aspectRatio as AspectRatio16x9);
    if (typeof snapshot.style === 'string') setStyle(snapshot.style);
    if (typeof snapshot.styleIntensity === 'number' && Number.isFinite(snapshot.styleIntensity)) setStyleIntensity(Math.max(0, Math.min(100, Math.round(snapshot.styleIntensity))));
    if (typeof snapshot.compareMode === 'boolean') setCompareMode(snapshot.compareMode);
    if (typeof snapshot.compareStyle === 'string') setCompareStyle(snapshot.compareStyle);
  };

  const loadPresets = (scope: 'character' | 'global', id?: string): GenerateFormPreset[] => {
    const key = scope === 'character' ? getCharacterPresetsKey(id || '') : GLOBAL_PRESETS_KEY;
    if (scope === 'character' && !id) return [];
    const parsed = parseStoredJson<GenerateFormPreset[]>(key);
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item.data).sort((a, b) => b.updatedAt - a.updatedAt) : [];
  };

  const savePresets = (scope: 'character' | 'global', presets: GenerateFormPreset[], id?: string) => {
    const key = scope === 'character' ? getCharacterPresetsKey(id || '') : GLOBAL_PRESETS_KEY;
    if (scope === 'character' && !id) return;
    localStorage.setItem(key, JSON.stringify(presets));
  };

  const saveNewPreset = (scope: 'character' | 'global') => {
    const name = presetName.trim() || `Preset ${new Date().toLocaleString()}`;
    const nextPreset: GenerateFormPreset = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, updatedAt: Date.now(), data: createFormSnapshot() };
    if (scope === 'character') {
      const next = [nextPreset, ...characterPresets].slice(0, 30);
      setCharacterPresets(next); setSelectedCharacterPresetId(nextPreset.id); savePresets(scope, next, primaryCharacterId);
    } else {
      const next = [nextPreset, ...globalPresets].slice(0, 30);
      setGlobalPresets(next); setSelectedGlobalPresetId(nextPreset.id); savePresets(scope, next);
    }
    setStorageInfo(`Saved ${scope} preset: ${name}`);
  };

  const overwritePreset = (scope: 'character' | 'global', id: string) => {
    const current = scope === 'character' ? characterPresets : globalPresets;
    const next = current.map((item) => item.id === id ? { ...item, name: presetName.trim() || item.name, updatedAt: Date.now(), data: createFormSnapshot() } : item);
    if (scope === 'character') { setCharacterPresets(next); savePresets(scope, next, primaryCharacterId); }
    else { setGlobalPresets(next); savePresets(scope, next); }
    setStorageInfo(`Updated ${scope} preset.`);
  };

  const loadPresetById = (scope: 'character' | 'global', id: string) => {
    const source = scope === 'character' ? characterPresets : globalPresets;
    const picked = source.find((item) => item.id === id);
    if (!picked) return;
    applyFormSnapshot(picked.data); setPresetName(picked.name); setStorageInfo(`Loaded ${scope} preset: ${picked.name}`);
  };

  const deletePresetById = (scope: 'character' | 'global', id: string) => {
    const source = scope === 'character' ? characterPresets : globalPresets;
    const next = source.filter((item) => item.id !== id);
    if (scope === 'character') { setCharacterPresets(next); savePresets(scope, next, primaryCharacterId); setSelectedCharacterPresetId(''); }
    else { setGlobalPresets(next); savePresets(scope, next); setSelectedGlobalPresetId(''); if (localStorage.getItem(GLOBAL_DEFAULT_PRESET_KEY) === id) localStorage.removeItem(GLOBAL_DEFAULT_PRESET_KEY); }
    setStorageInfo(`Deleted ${scope} preset.`);
  };

  useEffect(() => {
    fetch('/api/me').then((res) => res.json()).then((data) => {
      if (data?.authenticated) setUserPlan(data.plan === 'paid' || data.plan === 'admin' ? data.plan : 'free');
    }).catch(() => setUserPlan('free'));
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch('/api/presets', { cache: 'no-store' });
        const data: PresetCatalogResponse = await response.json();
        if (!response.ok) throw new Error('Failed to load presets');
        setCameraOptions(mergeOptions(DEFAULT_CAMERA_OPTIONS, data.presets?.camera));
        setStyleOptions(mergeOptions(DEFAULT_STYLE_OPTIONS, data.presets?.style));
        setLocationPresetOptions(mergeOptions(DEFAULT_LOCATION_OPTIONS, data.presets?.location));
      } catch (e) {
        console.error(e);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setPreviewImage(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/characters').then((res) => res.json()).then((chars: Character[]) => {
      setAllCharacters(chars); setCharacter(chars.find((c) => c.id === primaryCharacterId) || null);
    }).catch(() => setError('Failed to load characters'));
  }, [primaryCharacterId]);

  useEffect(() => {
    if (!character) return;
    setAliasMap((prev) => prev[character.id] ? prev : { ...prev, [character.id]: character.name?.trim()?.slice(0, 1).toUpperCase() || 'A' });
  }, [character]);

  useEffect(() => {
    if (!primaryCharacterId) return;
    hydratedRef.current = false;
    setCharacterPresets(loadPresets('character', primaryCharacterId));
    const globals = loadPresets('global');
    setGlobalPresets(globals);
    const savedForm = parseStoredJson<GenerateFormState>(getCharacterFormKey(primaryCharacterId));
    if (savedForm) {
      applyFormSnapshot(savedForm); setStorageInfo('Loaded last settings for this character.');
    } else {
      const defaultId = localStorage.getItem(GLOBAL_DEFAULT_PRESET_KEY);
      const defaultPreset = defaultId ? globals.find((item) => item.id === defaultId) : undefined;
      if (defaultPreset) { applyFormSnapshot(defaultPreset.data); setSelectedGlobalPresetId(defaultPreset.id); setStorageInfo(`Loaded global default preset: ${defaultPreset.name}`); }
    }
    hydratedRef.current = true;
  }, [primaryCharacterId]);

  useEffect(() => {
    try {
      const savedLocation = JSON.parse(localStorage.getItem(LOCATION_HISTORY_KEY) || '[]');
      const savedMood = JSON.parse(localStorage.getItem(MOOD_HISTORY_KEY) || '[]');
      if (Array.isArray(savedLocation)) setLocationHistory(savedLocation.filter((item) => typeof item === 'string'));
      if (Array.isArray(savedMood)) setMoodHistory(savedMood.filter((item) => typeof item === 'string'));
    } catch {}
  }, []);

  useEffect(() => {
    if (!primaryCharacterId || !hydratedRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(getCharacterFormKey(primaryCharacterId), JSON.stringify(createFormSnapshot()));
      setStorageInfo('Auto-saved current form.');
    }, 300);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [primaryCharacterId, location, mood, locationPreset, locationGeometry, locationLighting, locationPalette, locationProps, locationCameraContinuity, shotTemplate, lockGeometry, lockLighting, lockPalette, lockProps, lockCameraRules, continuityNotes, actionPrompt, extraCharacterIds, aliasMap, camera, aspectRatio, style, styleIntensity, compareMode, compareStyle]);

  const loadGeneratedImages = async () => {
    if (!primaryCharacterId) return;
    try {
      const response = await fetch(`/api/generated/${primaryCharacterId}/list`);
      const data = await response.json();
      setGeneratedImages((data.images || []).filter((img: any) => img.url));
    } catch {}
  };

  const loadReferenceImages = async () => {
    if (!primaryCharacterId || character?.type !== 'system' || userPlan !== 'admin') return;
    try {
      const response = await fetch(`/api/characters/${primaryCharacterId}/images`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Nem sikerült betölteni a referenciaképeket.');
      setGeneratedReferenceImages(data.images || []);
    } catch (error: any) {
      setReferenceError(error?.message || 'Nem sikerült betölteni a referenciaképeket.');
    }
  };

  const handleReferenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const slotsLeft = Math.max(0, 6 - generatedReferenceImages.length);
    if (files.length > slotsLeft) {
      setReferenceError(`Még ${slotsLeft} referenciahely maradt.`);
      return;
    }

    setReferenceUploading(true);
    setReferenceError('');
    try {
      const imageUrls = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })));

      const response = await fetch(`/api/characters/${primaryCharacterId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'A feltöltés sikertelen.');

      await loadReferenceImages();
    } catch (error: any) {
      setReferenceError(error?.message || 'A feltöltés sikertelen.');
    } finally {
      setReferenceUploading(false);
    }
  };

  const handleDeleteReferenceImage = async (imageId: string) => {
    if (!window.confirm('Biztosan törlöd ezt a referenciaképet?')) return;
    setReferenceError('');
    try {
      const response = await fetch(`/api/characters/${primaryCharacterId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'A törlés sikertelen.');
      await loadReferenceImages();
    } catch (error: any) {
      setReferenceError(error?.message || 'A törlés sikertelen.');
    }
  };

  useEffect(() => { loadGeneratedImages(); }, [primaryCharacterId]);
  useEffect(() => { loadReferenceImages(); }, [primaryCharacterId, character?.type, userPlan]);
  useEffect(() => { if (result || compareResult) loadGeneratedImages(); }, [result, compareResult]);

  const persistHistoryValue = (key: string, value: string, current: string[], setState: (next: string[]) => void) => {
    const trimmed = value.trim(); if (!trimmed) return;
    const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 12);
    setState(next); localStorage.setItem(key, JSON.stringify(next));
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    persistHistoryValue(LOCATION_HISTORY_KEY, location, locationHistory, setLocationHistory);
    persistHistoryValue(MOOD_HISTORY_KEY, mood, moodHistory, setMoodHistory);
    setLoading(true); setError(''); setResult(null); setCompareResult(null);
    try {
      const characterIds = [primaryCharacterId, ...extraCharacterIds].filter(Boolean);
      const selectedAliasMap: Record<string, string> = {};
      for (const id of characterIds) if (aliasMap[id]?.trim()) selectedAliasMap[id] = aliasMap[id].trim();
      const compareStylePayload = compareMode && compareStyle !== style ? compareStyle : undefined;
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: primaryCharacterId, characterIds, aliasMap: selectedAliasMap, location, mood, actionPrompt,
          scenePackage: { locationProfile: { preset: locationPreset, detail: location, geometry: locationGeometry, lightingAndTime: locationLighting, paletteAndTexture: locationPalette, fixedProps: locationProps, cameraContinuity: locationCameraContinuity }, continuity: { lockGeometry, lockLighting, lockPalette, lockProps, lockCameraRules, notes: continuityNotes.trim() || undefined }, shotTemplate, bilingualInput: { sourceLanguage: 'mixed' } },
          camera, aspectRatio, style, styleIntensity, compareStyle: compareStylePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate image');
      setResult(data.image); setCompareResult(data.compareImage || null);
    } catch (e: any) {
      setError(e?.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const selectedCharacters = [
    ...(character ? [character] : []),
    ...extraCharacterIds.map((id) => allCharacters.find((item) => item.id === id)).filter((item): item is Character => Boolean(item)),
  ];
  const availableCharacters = allCharacters.filter((item) => item.id !== primaryCharacterId && !extraCharacterIds.includes(item.id));

  const addExtraCharacter = () => {
    if (!pendingCharacterId || extraCharacterIds.includes(pendingCharacterId)) return;
    const picked = allCharacters.find((item) => item.id === pendingCharacterId);
    setExtraCharacterIds((prev) => [...prev, pendingCharacterId]);
    if (picked) setAliasMap((prev) => ({ ...prev, [pendingCharacterId]: prev[pendingCharacterId] || picked.name?.trim()?.slice(0, 1).toUpperCase() || 'C' }));
    setPendingCharacterId('');
  };

  const removeExtraCharacter = (id: string) => setExtraCharacterIds((prev) => prev.filter((value) => value !== id));
  const handleUseForAnimation = (url: string) => { setAnimatePreselectedUrl(url); setActiveTab('animate'); };

  const locationPresetCount = useMemo(() => locationPresetOptions.length, [locationPresetOptions]);
  const isPaid = userPlan === 'paid' || userPlan === 'admin';
  if (!character) return <main className="min-h-screen bg-black text-gray-100 font-mono flex items-center justify-center">Loading...</main>;

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono flex flex-col items-center mt-6">
      <div className="w-full max-w-7xl px-6">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Új jelenet</h1>
        </div>
        <div className="bg-zinc-950 rounded-lg border border-gray-800 p-4 mb-4 flex gap-4 items-start">
          <div className="flex gap-2 shrink-0">{(character.imagePaths || []).slice(0, 1).map((img: string, i: number) => <img key={i} src={img} alt="ref" className="w-24 h-24 object-cover rounded" />)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-bold text-xl">{character.name}</div>
            </div>
            <div className="text-gray-400 text-sm mb-1 line-clamp-2">{character.description}</div>
            <div className="text-xs text-gray-500">{character.traits.join(', ')}</div>
          </div>
        </div>

      {character.type === 'system' && userPlan === 'admin' && (
        <section className="mb-6 rounded-xl border border-gray-800 bg-zinc-950 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gray-600">ADMIN / REFERENCIA</div>
              <h2 className="text-base font-bold text-white">Referenciaképek</h2>
              <p className="mt-1 text-xs text-gray-500">A Gemini ezekből tanulja meg V megjelenését. Legfeljebb 6 kép használható.</p>
            </div>
            <div className="text-xs text-gray-600">{generatedReferenceImages.length} / 6 kép</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {generatedReferenceImages.map((image, index) => (
              <div key={image.id || image.path} className="group relative overflow-hidden rounded-lg border border-gray-800 bg-black">
                <img src={image.url} alt={`V referencia ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteReferenceImage(image.id)}
                  className="absolute right-1.5 top-1.5 hidden rounded-md bg-black/80 px-2 py-1 text-[10px] text-gray-300 group-hover:block hover:bg-red-950 hover:text-red-200"
                >
                  Törlés
                </button>
              </div>
            ))}

            {generatedReferenceImages.length < 6 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-700 bg-black/30 text-center transition hover:border-gray-500 hover:bg-zinc-900">
                <span className="text-xl text-gray-500">+</span>
                <span className="mt-1 px-2 text-[10px] text-gray-500">Kép hozzáadása</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleReferenceUpload}
                  disabled={referenceUploading}
                />
              </label>
            )}
          </div>

          {referenceUploading && <div className="mt-3 text-xs text-gray-500">Feltöltés…</div>}
          {referenceError && <div className="mt-3 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-300">{referenceError}</div>}
        </section>
      )}

        <div className="flex gap-1 mb-4 bg-zinc-950 rounded-lg border border-gray-800 p-1">
          {(['generate', 'gallery'] as Tab[]).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded text-sm font-semibold ${activeTab === tab ? 'bg-zinc-800 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}>{tab === 'generate' ? '✨ ' : tab === 'animate' ? '▶ ' : '🖼 '}{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}
        </div>

        <div className="bg-zinc-950 rounded-lg">
          {activeTab === 'generate' && (
            <>
              {!isPaid && (
                <div className="mb-4 rounded-lg border border-gray-800 bg-zinc-950 p-4 text-xs text-zinc-500">
                  FREE mód · 6 ingyenes kredit · alap generátor
                </div>
              )}

              <form onSubmit={handleGenerate} className="mb-8 space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Helyszín</label>
                  <textarea
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    rows={3}
                    placeholder="Hol történjen a jelenet?"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Hangulat</label>
                  <input
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    list="mood-history"
                    placeholder="Pl. feszült, nyugodt, kaotikus…"
                  />
                  <datalist id="mood-history">{moodHistory.map((item) => <option key={item} value={item} />)}</datalist>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Mi történjen?</label>
                  <textarea
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm"
                    value={actionPrompt}
                    onChange={(e) => setActionPrompt(e.target.value)}
                    rows={4}
                    placeholder="Írd le, mit csináljon a karakter."
                  />
                </div>

                <div className="rounded-lg border border-gray-800 bg-zinc-950 p-4">
                  <div className="text-sm font-semibold text-gray-300 mb-3">Szereplők</div>

                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => { setExtraCharacterIds([]); setPendingCharacterId(""); }}
                      className={selectedCharacters.length === 1 ? "flex-1 px-3 py-2 rounded border border-white bg-white text-black text-xs font-semibold" : "flex-1 px-3 py-2 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-semibold"}
                    >
                      1 karakter
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingCharacterId((current) => current || availableCharacters[0]?.id || "")}
                      disabled={!availableCharacters.length}
                      className={selectedCharacters.length > 1 ? "flex-1 px-3 py-2 rounded border border-white bg-white text-black text-xs font-semibold" : "flex-1 px-3 py-2 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-semibold"}
                    >
                      2 karakter
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedCharacters.map((item) => (
                      <span key={item.id} className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-300">
                        {item.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-2 rounded bg-gray-900 border border-gray-700 text-sm"
                      value={pendingCharacterId}
                      onChange={(e) => setPendingCharacterId(e.target.value)}
                    >
                      <option value="">+ Második karakter</option>
                      {availableCharacters.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addExtraCharacter}
                      disabled={!pendingCharacterId}
                      className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Hozzáadás
                    </button>
                  </div>

                  {selectedCharacters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => { setExtraCharacterIds([]); setPendingCharacterId(""); }}
                      className="mt-3 text-xs px-3 py-2 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                    >
                      Vissza 1 karakterre
                    </button>
                  )}

                  {isPaid && selectedCharacters.length > 1 && (
                    <div className="mt-3 space-y-2">
                      {selectedCharacters.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <div className="w-40 text-xs text-gray-400 truncate">{item.name}</div>
                          <input
                            className="w-28 p-1.5 rounded bg-gray-900 border border-gray-700 text-xs"
                            value={aliasMap[item.id] || ""}
                            onChange={(e) => setAliasMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Alias"
                            maxLength={12}
                          />
                          {item.id !== primaryCharacterId && (
                            <button type="button" onClick={() => removeExtraCharacter(item.id)} className="text-xs px-2 py-1 rounded border border-gray-700">
                              Törlés
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Helyszín preset</label>
                  <select className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm" value={locationPreset} onChange={(e) => setLocationPreset(e.target.value)}>
                    {locationPresetOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Kamera</label>
                  <select className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm" value={camera} onChange={(e) => setCamera(e.target.value)}>
                    {cameraOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Shot template</label>
                  <select className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm" value={shotTemplate} onChange={(e) => setShotTemplate(e.target.value as ShotTemplate)}>
                    {SHOT_TEMPLATE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Képarány</label>
                  <select
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio16x9)}
                  >
                    {ASPECT_RATIO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Stílus</label>
                  <select
                    className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-sm"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    {styleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                {isPaid && (
                  <>
                    <details className="rounded-lg border border-gray-800 bg-zinc-950 p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-300">Haladó generálás</summary>
                      <div className="pt-4 space-y-4">
                        <div>
                          <label className="block mb-1 text-sm font-semibold text-gray-300">Generálási presetek</label>
                          <select className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={selectedGlobalPresetId} onChange={(e) => setSelectedGlobalPresetId(e.target.value)}>
                            <option value="">Nincs kiválasztva</option>
                            {globalPresets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button type="button" className="px-2 py-1 rounded bg-gray-800 text-xs" onClick={() => saveNewPreset('global')}>Mentés</button>
                            <button type="button" className="px-2 py-1 rounded border border-gray-700 text-xs" disabled={!selectedGlobalPresetId} onClick={() => loadPresetById('global', selectedGlobalPresetId)}>Betöltés</button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Geometria</label>
                            <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={locationGeometry} onChange={(e) => setLocationGeometry(e.target.value)} rows={2} />
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Világítás és idő</label>
                            <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={locationLighting} onChange={(e) => setLocationLighting(e.target.value)} rows={2} />
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Paletta és textúra</label>
                            <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={locationPalette} onChange={(e) => setLocationPalette(e.target.value)} rows={2} />
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Fix kellékek</label>
                            <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={locationProps} onChange={(e) => setLocationProps(e.target.value)} rows={2} />
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Kamerafolytonossági szabályok</label>
                            <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={locationCameraContinuity} onChange={(e) => setLocationCameraContinuity(e.target.value)} rows={2} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                          <label className="flex items-center gap-2"><input type="checkbox" checked={lockGeometry} onChange={(e) => setLockGeometry(e.target.checked)} />Geometria rögzítése</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={lockLighting} onChange={(e) => setLockLighting(e.target.checked)} />Világítás rögzítése</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={lockPalette} onChange={(e) => setLockPalette(e.target.checked)} />Paletta rögzítése</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={lockProps} onChange={(e) => setLockProps(e.target.checked)} />Kellékek rögzítése</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={lockCameraRules} onChange={(e) => setLockCameraRules(e.target.checked)} />Kamerafolytonosság rögzítése</label>
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-semibold text-gray-300">Continuity notes</label>
                          <textarea className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={continuityNotes} onChange={(e) => setContinuityNotes(e.target.value)} rows={2} />
                        </div>

                        <div>
                          <label className="block mb-1 text-sm font-semibold text-gray-300">Style intensity: {styleIntensity}</label>
                          <input type="range" min={0} max={100} value={styleIntensity} onChange={(e) => setStyleIntensity(Number(e.target.value))} className="w-full accent-indigo-500" />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
                          A/B összehasonlítás
                        </label>

                        {compareMode && (
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-gray-300">Második stílus</label>
                            <select className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-sm" value={compareStyle} onChange={(e) => setCompareStyle(e.target.value)}>
                              {styleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </details>

                    {storageInfo && <div className="text-xs text-gray-500">{storageInfo}</div>}
                  </>
                )}

                {error && <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded px-3 py-2">{error}</div>}

                <button type="submit" disabled={loading} className="w-full bg-white hover:bg-gray-200 text-black disabled:opacity-50 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                  {loading ? 'Generálás…' : '✨ Kép generálása'}
                </button>
              </form>

              {result && (
                <div className="space-y-4">
                  {compareResult ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-900 rounded p-3">
                        <div className="text-xs text-gray-400 mb-2">A: {style}</div>
                        <button type="button" className="w-full" onClick={() => setPreviewImage(result)}>
                          <img src={result} alt="A" className="rounded w-full cursor-zoom-in" />
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded p-3">
                        <div className="text-xs text-gray-400 mb-2">B: {compareStyle}</div>
                        <button type="button" className="w-full" onClick={() => setPreviewImage(compareResult)}>
                          <img src={compareResult} alt="B" className="rounded w-full cursor-zoom-in" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <button type="button" className="focus:outline-none rounded" onClick={() => setPreviewImage(result)}>
                        <img src={result} alt="Generated scene" className="rounded shadow-lg max-w-full cursor-zoom-in" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'gallery' && <Gallery characterId={primaryCharacterId} onUseForAnimation={handleUseForAnimation} />}
        </div>
      </div>

      {previewImage && <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)} role="dialog" aria-modal="true"><div className="relative max-w-6xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}><button type="button" onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white text-sm bg-gray-800 px-3 py-1 rounded">Close</button><img src={previewImage} alt="Preview" className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl" /></div></div>}
    </main>
  );
}
