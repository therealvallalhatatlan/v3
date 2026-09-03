'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import type { ImageInfo } from './AnimationPanel';
import type { Character } from '../../../types';
import type { AspectRatio16x9, LocationPreset, ShotTemplate } from '../../../types/prompt';

const cameraOptions = [
  { value: 'close-up', label: 'Close-up' },
  { value: 'wide', label: 'Wide' },
  { value: 'fisheye', label: 'Fisheye' },
  { value: 'handheld', label: 'Handheld (Cinematic Realism)' },
  { value: 'dutch', label: 'Dutch Angle (Tension)' },
  { value: 'birdseye', label: "Bird\'s-Eye (Top-Down)" },
  { value: 'overtheshoulder', label: 'Over-the-Shoulder (POV Drama)' },
  { value: 'wormseye', label: "Worm\'s-Eye (Heroic Low Angle)" },
  { value: 'speedcam1999', label: 'Rendőrségi Traffipax 1999 (Éjszakai)' },
  { value: 'security-cam', label: 'Security Camera (Fixed Surveillance)' },
  { value: 'telephoto-stakeout', label: 'Telephoto Stakeout (Long-Lens Surveillance)' },
  { value: 'cctv-distorted', label: 'CCTV Fisheye Distortion (Surveillance Archive)' },
  { value: 'reflection-pov', label: 'Reflection POV (Mirror/Glass Subjective)' },
  { value: 'macro-forensic', label: 'Macro Forensic Detail (Extreme Close-Up)' },
  { value: 'pov-dashboard', label: 'Dashboard POV (In-Vehicle First-Person)' },
];

const styleOptions = [
  { value: 'gritty', label: 'Gritty Underground (Default)' },
  { value: 'noir-bw', label: 'Black and White Film Noir' },
  { value: 'vhs-glitch', label: 'Glitch VHS Analog Camera' },
  { value: 'neo-noir-neon', label: 'Neo Noir Neon' },
  { value: 'dreamy-ethereal', label: 'Dreamy Ethereal' },
  { value: 'graphic-novel', label: 'Graphic Novel' },
  { value: 'police-speed-photo', label: 'Police Speeding Camera Photo' },
];

const locationPresetOptions: Array<{ value: LocationPreset; label: string }> = [
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

const shotTemplateOptions: Array<{ value: ShotTemplate; label: string }> = [
  { value: 'establishing-wide', label: 'Establishing Wide' },
  { value: 'medium-dialogue', label: 'Medium Dialogue' },
  { value: 'closeup-emotion', label: 'Close-up Emotion' },
  { value: 'over-shoulder', label: 'Over-Shoulder' },
  { value: 'insert-detail', label: 'Insert Detail' },
  { value: 'tracking-motion', label: 'Tracking Motion' },
];

const aspectRatioOptions: Array<{ value: AspectRatio16x9; label: string }> = [
  { value: 'landscape-16-9', label: 'Fekvo 16:9' },
  { value: 'portrait-9-16', label: 'Allo 9:16' },
];

const LOCATION_HISTORY_KEY = 'illustration.location.history';
const MOOD_HISTORY_KEY = 'illustration.mood.history';
const HISTORY_LIMIT = 12;
const GENERATE_FORM_VERSION = 'v1';
const CHAR_FORM_KEY_PREFIX = `illustration.generate.form.${GENERATE_FORM_VERSION}.character`;
const CHAR_PRESETS_KEY_PREFIX = `illustration.generate.presets.${GENERATE_FORM_VERSION}.character`;
const GLOBAL_PRESETS_KEY = `illustration.generate.presets.${GENERATE_FORM_VERSION}.global`;
const GLOBAL_DEFAULT_PRESET_KEY = `illustration.generate.defaultPreset.${GENERATE_FORM_VERSION}.global`;

type GenerateFormState = {
  location: string;
  mood: string;
  locationPreset: LocationPreset;
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

type GenerateFormPreset = {
  id: string;
  name: string;
  updatedAt: number;
  data: GenerateFormState;
};

type Tab = 'generate' | 'animate' | 'gallery';

const Gallery = dynamic(() => import('./Gallery'), { ssr: false });
const AnimationPanel = dynamic(() => import('./AnimationPanel'), { ssr: false });

export default function CharacterDetailPage() {
  const { id } = useParams();
  const primaryCharacterId = Array.isArray(id) ? id[0] : String(id || '');
  const [character, setCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generate tab state
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
  const [camera, setCamera] = useState(cameraOptions[0].value);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio16x9>('landscape-16-9');
  const [style, setStyle] = useState(styleOptions[0].value);
  const [styleIntensity, setStyleIntensity] = useState(65);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStyle, setCompareStyle] = useState(styleOptions[1].value);
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

  // Shared image state used by Animate + Gallery tabs
  const [generatedImages, setGeneratedImages] = useState<ImageInfo[]>([]);
  const [animatePreselectedUrl, setAnimatePreselectedUrl] = useState<string>('');
  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cameraValueSet = new Set(cameraOptions.map((item) => item.value));
  const aspectRatioValueSet = new Set(aspectRatioOptions.map((item) => item.value));
  const styleValueSet = new Set(styleOptions.map((item) => item.value));
  const locationPresetValueSet = new Set(locationPresetOptions.map((item) => item.value));
  const shotTemplateValueSet = new Set(shotTemplateOptions.map((item) => item.value));

  const getCharacterFormKey = (characterId: string) => `${CHAR_FORM_KEY_PREFIX}.${characterId}`;
  const getCharacterPresetsKey = (characterId: string) => `${CHAR_PRESETS_KEY_PREFIX}.${characterId}`;

  const parseStoredJson = <T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const createFormSnapshot = (): GenerateFormState => ({
    location,
    mood,
    locationPreset,
    locationGeometry,
    locationLighting,
    locationPalette,
    locationProps,
    locationCameraContinuity,
    shotTemplate,
    lockGeometry,
    lockLighting,
    lockPalette,
    lockProps,
    lockCameraRules,
    continuityNotes,
    actionPrompt,
    extraCharacterIds,
    aliasMap,
    camera,
    aspectRatio,
    style,
    styleIntensity,
    compareMode,
    compareStyle,
  });

  const applyFormSnapshot = (snapshot: Partial<GenerateFormState>) => {
    if (typeof snapshot.location === 'string') setLocation(snapshot.location);
    if (typeof snapshot.mood === 'string') setMood(snapshot.mood);
    if (typeof snapshot.locationPreset === 'string' && locationPresetValueSet.has(snapshot.locationPreset as LocationPreset)) {
      setLocationPreset(snapshot.locationPreset as LocationPreset);
    }
    if (typeof snapshot.locationGeometry === 'string') setLocationGeometry(snapshot.locationGeometry);
    if (typeof snapshot.locationLighting === 'string') setLocationLighting(snapshot.locationLighting);
    if (typeof snapshot.locationPalette === 'string') setLocationPalette(snapshot.locationPalette);
    if (typeof snapshot.locationProps === 'string') setLocationProps(snapshot.locationProps);
    if (typeof snapshot.locationCameraContinuity === 'string') setLocationCameraContinuity(snapshot.locationCameraContinuity);
    if (typeof snapshot.shotTemplate === 'string' && shotTemplateValueSet.has(snapshot.shotTemplate as ShotTemplate)) {
      setShotTemplate(snapshot.shotTemplate as ShotTemplate);
    }
    if (typeof snapshot.lockGeometry === 'boolean') setLockGeometry(snapshot.lockGeometry);
    if (typeof snapshot.lockLighting === 'boolean') setLockLighting(snapshot.lockLighting);
    if (typeof snapshot.lockPalette === 'boolean') setLockPalette(snapshot.lockPalette);
    if (typeof snapshot.lockProps === 'boolean') setLockProps(snapshot.lockProps);
    if (typeof snapshot.lockCameraRules === 'boolean') setLockCameraRules(snapshot.lockCameraRules);
    if (typeof snapshot.continuityNotes === 'string') setContinuityNotes(snapshot.continuityNotes);
    if (typeof snapshot.actionPrompt === 'string') setActionPrompt(snapshot.actionPrompt);
    if (Array.isArray(snapshot.extraCharacterIds)) setExtraCharacterIds(snapshot.extraCharacterIds.filter(Boolean));
    if (snapshot.aliasMap && typeof snapshot.aliasMap === 'object') setAliasMap(snapshot.aliasMap);
    if (typeof snapshot.camera === 'string' && cameraValueSet.has(snapshot.camera)) setCamera(snapshot.camera);
    if (typeof snapshot.aspectRatio === 'string' && aspectRatioValueSet.has(snapshot.aspectRatio as AspectRatio16x9)) {
      setAspectRatio(snapshot.aspectRatio as AspectRatio16x9);
    }
    if (typeof snapshot.style === 'string' && styleValueSet.has(snapshot.style)) setStyle(snapshot.style);
    if (typeof snapshot.styleIntensity === 'number' && Number.isFinite(snapshot.styleIntensity)) {
      setStyleIntensity(Math.max(0, Math.min(100, Math.round(snapshot.styleIntensity))));
    }
    if (typeof snapshot.compareMode === 'boolean') setCompareMode(snapshot.compareMode);
    if (typeof snapshot.compareStyle === 'string' && styleValueSet.has(snapshot.compareStyle)) setCompareStyle(snapshot.compareStyle);
  };

  const loadPresets = (scope: 'character' | 'global', characterId?: string): GenerateFormPreset[] => {
    const key = scope === 'character'
      ? getCharacterPresetsKey(characterId || '')
      : GLOBAL_PRESETS_KEY;
    if (scope === 'character' && !characterId) return [];
    const parsed = parseStoredJson<GenerateFormPreset[]>(key);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && item.data).sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const savePresets = (scope: 'character' | 'global', presets: GenerateFormPreset[], characterId?: string) => {
    const key = scope === 'character'
      ? getCharacterPresetsKey(characterId || '')
      : GLOBAL_PRESETS_KEY;
    if (scope === 'character' && !characterId) return;
    localStorage.setItem(key, JSON.stringify(presets));
  };

  const saveNewPreset = (scope: 'character' | 'global') => {
    const name = presetName.trim() || `Preset ${new Date().toLocaleString()}`;
    const nextPreset: GenerateFormPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      updatedAt: Date.now(),
      data: createFormSnapshot(),
    };

    if (scope === 'character') {
      const next = [nextPreset, ...characterPresets].slice(0, 30);
      setCharacterPresets(next);
      setSelectedCharacterPresetId(nextPreset.id);
      savePresets('character', next, primaryCharacterId);
    } else {
      const next = [nextPreset, ...globalPresets].slice(0, 30);
      setGlobalPresets(next);
      setSelectedGlobalPresetId(nextPreset.id);
      savePresets('global', next);
    }
    setStorageInfo(`Saved ${scope} preset: ${name}`);
  };

  const overwritePreset = (scope: 'character' | 'global', presetId: string) => {
    if (!presetId) return;
    const current = scope === 'character' ? characterPresets : globalPresets;
    const next = current.map((item) => {
      if (item.id !== presetId) return item;
      return {
        ...item,
        name: presetName.trim() || item.name,
        updatedAt: Date.now(),
        data: createFormSnapshot(),
      };
    }).sort((a, b) => b.updatedAt - a.updatedAt);

    if (scope === 'character') {
      setCharacterPresets(next);
      savePresets('character', next, primaryCharacterId);
    } else {
      setGlobalPresets(next);
      savePresets('global', next);
    }
    setStorageInfo(`Updated ${scope} preset.`);
  };

  const loadPresetById = (scope: 'character' | 'global', presetId: string) => {
    const source = scope === 'character' ? characterPresets : globalPresets;
    const picked = source.find((item) => item.id === presetId);
    if (!picked) return;
    applyFormSnapshot(picked.data);
    setPresetName(picked.name);
    setStorageInfo(`Loaded ${scope} preset: ${picked.name}`);
  };

  const deletePresetById = (scope: 'character' | 'global', presetId: string) => {
    if (!presetId) return;
    if (scope === 'character') {
      const next = characterPresets.filter((item) => item.id !== presetId);
      setCharacterPresets(next);
      setSelectedCharacterPresetId('');
      savePresets('character', next, primaryCharacterId);
    } else {
      const next = globalPresets.filter((item) => item.id !== presetId);
      setGlobalPresets(next);
      setSelectedGlobalPresetId('');
      savePresets('global', next);
      const globalDefaultId = localStorage.getItem(GLOBAL_DEFAULT_PRESET_KEY);
      if (globalDefaultId === presetId) {
        localStorage.removeItem(GLOBAL_DEFAULT_PRESET_KEY);
      }
    }
    setStorageInfo(`Deleted ${scope} preset.`);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/characters')
      .then((res) => res.json())
      .then((chars: Character[]) => {
        setAllCharacters(chars);
        setCharacter(chars.find((c) => c.id === primaryCharacterId) || null);
      });
  }, [primaryCharacterId]);

  useEffect(() => {
    if (!character) return;
    setAliasMap((prev) => {
      if (prev[character.id]) return prev;
      return {
        ...prev,
        [character.id]: character.name?.trim()?.slice(0, 1).toUpperCase() || 'A',
      };
    });
  }, [character]);

  useEffect(() => {
    if (!primaryCharacterId) return;
    hydratedRef.current = false;

    const charPresets = loadPresets('character', primaryCharacterId);
    const globalSavedPresets = loadPresets('global');
    setCharacterPresets(charPresets);
    setGlobalPresets(globalSavedPresets);

    const savedCharacterForm = parseStoredJson<GenerateFormState>(getCharacterFormKey(primaryCharacterId));
    if (savedCharacterForm) {
      applyFormSnapshot(savedCharacterForm);
      setStorageInfo('Loaded last settings for this character.');
      hydratedRef.current = true;
      return;
    }

    const globalDefaultId = localStorage.getItem(GLOBAL_DEFAULT_PRESET_KEY);
    if (globalDefaultId) {
      const defaultPreset = globalSavedPresets.find((item) => item.id === globalDefaultId);
      if (defaultPreset) {
        applyFormSnapshot(defaultPreset.data);
        setSelectedGlobalPresetId(defaultPreset.id);
        setStorageInfo(`Loaded global default preset: ${defaultPreset.name}`);
      }
    }

    hydratedRef.current = true;
  }, [primaryCharacterId]);

  const loadGeneratedImages = async () => {
    if (!primaryCharacterId) return;
    const res = await fetch(`/api/generated/${primaryCharacterId}/list`);
    const data = await res.json();
    const images: ImageInfo[] = (data.images || []).filter((img: any) => img.url);
    setGeneratedImages(images);
  };

  useEffect(() => {
    loadGeneratedImages();
  }, [primaryCharacterId]);

  // Reload images after a new generation
  useEffect(() => {
    if (result || compareResult) {
      loadGeneratedImages();
    }
  }, [result, compareResult]);

  useEffect(() => {
    try {
      const storedLocation = localStorage.getItem(LOCATION_HISTORY_KEY);
      const storedMood = localStorage.getItem(MOOD_HISTORY_KEY);
      if (storedLocation) {
        const parsed = JSON.parse(storedLocation);
        if (Array.isArray(parsed)) {
          setLocationHistory(parsed.filter((item) => typeof item === 'string'));
        }
      }
      if (storedMood) {
        const parsed = JSON.parse(storedMood);
        if (Array.isArray(parsed)) {
          setMoodHistory(parsed.filter((item) => typeof item === 'string'));
        }
      }
    } catch {
      setLocationHistory([]);
      setMoodHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!primaryCharacterId || !hydratedRef.current) return;
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(getCharacterFormKey(primaryCharacterId), JSON.stringify(createFormSnapshot()));
      setStorageInfo('Auto-saved current form.');
    }, 300);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    primaryCharacterId,
    location,
    mood,
    locationPreset,
    locationGeometry,
    locationLighting,
    locationPalette,
    locationProps,
    locationCameraContinuity,
    shotTemplate,
    lockGeometry,
    lockLighting,
    lockPalette,
    lockProps,
    lockCameraRules,
    continuityNotes,
    actionPrompt,
    extraCharacterIds,
    aliasMap,
    camera,
    aspectRatio,
    style,
    styleIntensity,
    compareMode,
    compareStyle,
  ]);

  const persistHistoryValue = (
    key: string,
    value: string,
    current: string[],
    setState: (next: string[]) => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, HISTORY_LIMIT);
    setState(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    persistHistoryValue(LOCATION_HISTORY_KEY, location, locationHistory, setLocationHistory);
    persistHistoryValue(MOOD_HISTORY_KEY, mood, moodHistory, setMoodHistory);
    setLoading(true);
    setError('');
    setResult(null);
    setCompareResult(null);

    try {
      const compareStylePayload = compareMode && compareStyle !== style ? compareStyle : undefined;
      const characterIds = [primaryCharacterId, ...extraCharacterIds].filter(Boolean);
      const selectedAliasMap: Record<string, string> = {};
      for (const characterId of characterIds) {
        const alias = String(aliasMap[characterId] || '').trim();
        if (alias) selectedAliasMap[characterId] = alias;
      }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: primaryCharacterId,
          characterIds,
          aliasMap: selectedAliasMap,
          location,
          mood,
          actionPrompt,
          scenePackage: {
            locationProfile: {
              preset: locationPreset,
              detail: location,
              geometry: locationGeometry,
              lightingAndTime: locationLighting,
              paletteAndTexture: locationPalette,
              fixedProps: locationProps,
              cameraContinuity: locationCameraContinuity,
            },
            continuity: {
              lockGeometry,
              lockLighting,
              lockPalette,
              lockProps,
              lockCameraRules,
              notes: continuityNotes.trim() || undefined,
            },
            shotTemplate,
            bilingualInput: {
              sourceLanguage: 'mixed',
            },
          },
          camera,
          aspectRatio,
          style,
          styleIntensity,
          compareStyle: compareStylePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setResult(data.image);
      setCompareResult(data.compareImage || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCharacters = [
    ...(character ? [character] : []),
    ...extraCharacterIds
      .map((characterId) => allCharacters.find((item) => item.id === characterId))
      .filter((item): item is Character => Boolean(item)),
  ];

  const availableCharacters = allCharacters.filter(
    (item) => item.id !== primaryCharacterId && !extraCharacterIds.includes(item.id)
  );

  const addExtraCharacter = () => {
    const nextId = pendingCharacterId.trim();
    if (!nextId || extraCharacterIds.includes(nextId)) return;
    setExtraCharacterIds((prev) => [...prev, nextId]);
    const picked = allCharacters.find((item) => item.id === nextId);
    if (picked) {
      setAliasMap((prev) => ({
        ...prev,
        [nextId]: prev[nextId] || (picked.name?.trim()?.slice(0, 1).toUpperCase() || `C${prev.length + 1}`),
      }));
    }
    setPendingCharacterId('');
  };

  const removeExtraCharacter = (characterId: string) => {
    setExtraCharacterIds((prev) => prev.filter((idValue) => idValue !== characterId));
  };

  // Navigate to Animate tab and pre-select an image
  const handleUseForAnimation = (url: string) => {
    setAnimatePreselectedUrl(url);
    setActiveTab('animate');
  };

  if (!character) return <main className="min-h-screen bg-black text-gray-100 font-mono flex items-center justify-center">Loading...</main>;

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-3xl">

        {/* ── Character Header ── */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4 flex gap-4 items-start">
          <div className="flex gap-2 flex-shrink-0">
            {(character.imagePaths || []).slice(0, 2).map((img: string, i: number) => (
              <img key={i} src={img} alt="ref" className="w-16 h-16 object-cover rounded" />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xl mb-0.5">{character.name}</div>
            <div className="text-gray-400 text-sm mb-1 line-clamp-2">{character.description}</div>
            <div className="text-xs text-gray-500">{character.traits.join(', ')}</div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 mb-4 bg-gray-900 rounded-lg border border-gray-800 p-1">
          {(['generate', 'animate', 'gallery'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {tab === 'generate' && '✨ '}
              {tab === 'animate' && '▶ '}
              {tab === 'gallery' && '🖼 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 md:p-8">

          {/* GENERATE */}
          {activeTab === 'generate' && (
            <>
              <form onSubmit={handleGenerate} className="mb-8 space-y-3">
                <div className="rounded border border-gray-700 bg-gray-800/40 p-3 space-y-2">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Generate Presets and Auto-Restore</div>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name (optional for new save)"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-300">Character presets</label>
                      <select
                        className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        value={selectedCharacterPresetId}
                        onChange={(e) => setSelectedCharacterPresetId(e.target.value)}
                      >
                        <option value="">Select character preset...</option>
                        {characterPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="px-2 py-1 rounded bg-indigo-800 hover:bg-indigo-700 text-xs" onClick={() => saveNewPreset('character')}>Save New</button>
                        <button type="button" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs" disabled={!selectedCharacterPresetId} onClick={() => overwritePreset('character', selectedCharacterPresetId)}>Overwrite</button>
                        <button type="button" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs" disabled={!selectedCharacterPresetId} onClick={() => loadPresetById('character', selectedCharacterPresetId)}>Load</button>
                        <button type="button" className="px-2 py-1 rounded border border-gray-600 hover:border-red-500 text-xs" disabled={!selectedCharacterPresetId} onClick={() => deletePresetById('character', selectedCharacterPresetId)}>Delete</button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-300">Global presets</label>
                      <select
                        className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        value={selectedGlobalPresetId}
                        onChange={(e) => setSelectedGlobalPresetId(e.target.value)}
                      >
                        <option value="">Select global preset...</option>
                        {globalPresets.map((preset) => (
                          <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="px-2 py-1 rounded bg-indigo-800 hover:bg-indigo-700 text-xs" onClick={() => saveNewPreset('global')}>Save New</button>
                        <button type="button" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs" disabled={!selectedGlobalPresetId} onClick={() => overwritePreset('global', selectedGlobalPresetId)}>Overwrite</button>
                        <button type="button" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs" disabled={!selectedGlobalPresetId} onClick={() => loadPresetById('global', selectedGlobalPresetId)}>Load</button>
                        <button type="button" className="px-2 py-1 rounded border border-gray-600 hover:border-red-500 text-xs" disabled={!selectedGlobalPresetId} onClick={() => deletePresetById('global', selectedGlobalPresetId)}>Delete</button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded border border-indigo-700 hover:border-indigo-500 text-xs"
                          disabled={!selectedGlobalPresetId}
                          onClick={() => {
                            if (!selectedGlobalPresetId) return;
                            localStorage.setItem(GLOBAL_DEFAULT_PRESET_KEY, selectedGlobalPresetId);
                            setStorageInfo('Saved selected global preset as default.');
                          }}
                        >
                          Set as default
                        </button>
                      </div>
                    </div>
                  </div>

                  {storageInfo && <div className="text-xs text-gray-400">{storageInfo}</div>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Location Preset</label>
                  <select
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={locationPreset}
                    onChange={(e) => setLocationPreset(e.target.value as LocationPreset)}
                  >
                    {locationPresetOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Location</label>
                  <textarea
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    rows={4}
                    placeholder="Részletes helyszínleírás HU/EN. Ez lesz a location profile fő leírása."
                  />
                </div>

                <div className="rounded border border-gray-700 bg-gray-800/40 p-3 space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Location Profile Continuity</div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Spatial geometry and layout</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={locationGeometry}
                      onChange={(e) => setLocationGeometry(e.target.value)}
                      rows={2}
                      placeholder="Pl.: Szűk folyosó bal oldali ajtókkal, hátul nagy ablak..."
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Lighting and time of day</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={locationLighting}
                      onChange={(e) => setLocationLighting(e.target.value)}
                      rows={2}
                      placeholder="Pl.: Éjjeli hideg fény jobbról, gyenge narancs háttérfény"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Palette and textures</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={locationPalette}
                      onChange={(e) => setLocationPalette(e.target.value)}
                      rows={2}
                      placeholder="Pl.: Fakó zöld falak, rozsdás fém, nedves beton textúra"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Fixed props and positions</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={locationProps}
                      onChange={(e) => setLocationProps(e.target.value)}
                      rows={2}
                      placeholder="Pl.: Törött neon tábla bal fent, piros kanapé középen"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Camera continuity rules</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={locationCameraContinuity}
                      onChange={(e) => setLocationCameraContinuity(e.target.value)}
                      rows={2}
                      placeholder="Pl.: Tartsd a 180 fokos tengelyt, ne forduljon át az irány"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Shot Template</label>
                    <select
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={shotTemplate}
                      onChange={(e) => setShotTemplate(e.target.value as ShotTemplate)}
                    >
                      {shotTemplateOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={lockGeometry} onChange={(e) => setLockGeometry(e.target.checked)} /> Lock geometry</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={lockLighting} onChange={(e) => setLockLighting(e.target.checked)} /> Lock lighting</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={lockPalette} onChange={(e) => setLockPalette(e.target.checked)} /> Lock palette</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={lockProps} onChange={(e) => setLockProps(e.target.checked)} /> Lock props</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={lockCameraRules} onChange={(e) => setLockCameraRules(e.target.checked)} /> Lock camera rules</label>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Continuity notes (optional)</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={continuityNotes}
                      onChange={(e) => setContinuityNotes(e.target.value)}
                      rows={2}
                      placeholder="Extra continuity directives for subsequent shots"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Mood</label>
                  <input
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    list="mood-history"
                  />
                  <datalist id="mood-history">
                    {moodHistory.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </div>

                <div className="rounded border border-gray-700 bg-gray-800/50 p-3 space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Cast (add more characters)</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                        value={pendingCharacterId}
                        onChange={(e) => setPendingCharacterId(e.target.value)}
                      >
                        <option value="">Select character...</option>
                        {availableCharacters.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addExtraCharacter}
                        className="px-3 py-2 rounded bg-indigo-800 hover:bg-indigo-700 text-sm font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {selectedCharacters.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-40 text-xs text-gray-300 truncate">{item.name}</div>
                        <input
                          className="w-28 p-1.5 rounded bg-gray-800 border border-gray-700 text-xs focus:outline-none focus:border-indigo-500"
                          value={aliasMap[item.id] || ''}
                          onChange={(e) => setAliasMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Alias (e.g. V)"
                          maxLength={12}
                        />
                        {item.id !== primaryCharacterId && (
                          <button
                            type="button"
                            onClick={() => removeExtraCharacter(item.id)}
                            className="text-xs px-2 py-1 rounded border border-gray-600 hover:border-red-500 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Shared action prompt</label>
                    <textarea
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={actionPrompt}
                      onChange={(e) => setActionPrompt(e.target.value)}
                      rows={2}
                      placeholder="Pl.: V és B egy vízibiciklin ülnek"
                    />
                    <div className="text-xs text-gray-500 mt-1">Az aliasokat szabad szövegben is használhatod.</div>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Camera</label>
                  <select
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                  >
                    {cameraOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Képarány</label>
                  <select
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio16x9)}
                  >
                    {aspectRatioOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">Style</label>
                  <select
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  >
                    {styleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-300">
                    Style Intensity: <span className="text-indigo-400">{styleIntensity}</span>
                  </label>
                  <input
                    type="range" min={0} max={100} step={1}
                    value={styleIntensity}
                    onChange={(e) => setStyleIntensity(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">0 = subtle · 100 = very strong stylization</div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={compareMode}
                      onChange={(e) => setCompareMode(e.target.checked)}
                    />
                    Compare with second style (A/B)
                  </label>
                </div>

                {compareMode && (
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-300">Compare Style</label>
                    <select
                      className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-indigo-500"
                      value={compareStyle}
                      onChange={(e) => setCompareStyle(e.target.value)}
                    >
                      {styleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {compareStyle === style && (
                      <div className="text-xs text-yellow-400 mt-1">Pick a different style for A/B.</div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded px-3 py-2">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 py-2.5 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Generating…
                    </>
                  ) : '✨ Generate Scene'}
                </button>
              </form>

              {/* Single result */}
              {result && !compareResult && (
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    className="focus:outline-none rounded"
                    onClick={() => setPreviewImage(result)}
                  >
                    <img src={result} alt="Generated scene" className="rounded shadow-lg max-w-full cursor-zoom-in" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseForAnimation(result)}
                    className="text-sm bg-indigo-800 hover:bg-indigo-700 px-5 py-2 rounded font-semibold transition-colors"
                  >
                    ▶ Animate this image
                  </button>
                </div>
              )}

              {/* A/B result */}
              {result && compareResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400 mb-2">A: {style}</div>
                    <button type="button" className="w-full focus:outline-none rounded" onClick={() => setPreviewImage(result)}>
                      <img src={result} alt="A" className="rounded shadow-lg w-full cursor-zoom-in" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseForAnimation(result)}
                      className="mt-2 w-full text-xs bg-indigo-800 hover:bg-indigo-700 py-1.5 rounded font-semibold transition-colors"
                    >
                      ▶ Animate A
                    </button>
                  </div>
                  <div className="bg-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400 mb-2">B: {compareStyle}</div>
                    <button type="button" className="w-full focus:outline-none rounded" onClick={() => setPreviewImage(compareResult)}>
                      <img src={compareResult} alt="B" className="rounded shadow-lg w-full cursor-zoom-in" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseForAnimation(compareResult)}
                      className="mt-2 w-full text-xs bg-indigo-800 hover:bg-indigo-700 py-1.5 rounded font-semibold transition-colors"
                    >
                      ▶ Animate B
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ANIMATE */}
          {activeTab === 'animate' && (
            <AnimationPanel
              characterId={primaryCharacterId}
              characterIds={[primaryCharacterId, ...extraCharacterIds].filter(Boolean)}
              images={generatedImages}
              initialSelectedUrl={animatePreselectedUrl || generatedImages[0]?.url || ''}
            />
          )}

          {/* GALLERY */}
          {activeTab === 'gallery' && (
            <Gallery
              characterId={primaryCharacterId}
              onUseForAnimation={handleUseForAnimation}
            />
          )}
        </div>
      </div>

      {/* ── Full-screen Preview Modal ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative max-w-6xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
            >
              Close
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

