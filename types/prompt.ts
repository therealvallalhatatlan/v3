export type CharacterDNA = {
  sourceCharacterId?: string;
  alias?: string;
  identity: { name: string; archetype: string };
  physical: { face: string; body: string; posture: string };
  outfit: { top: string; bottom: string; accessories: string[] };
  anchors: string[];
  texture: { material: string; wear: string; dirt: string };
  energy: string;
  environmentAffinity: string[];
};

export type LocationPreset = string;
export type StylePreset = string;
export type ShotTemplate = 'establishing-wide' | 'medium-dialogue' | 'closeup-emotion' | 'over-shoulder' | 'insert-detail' | 'tracking-motion';
export type AspectRatio16x9 = 'landscape-16-9' | 'portrait-9-16';

export type SceneInput = {
  location: string;
  mood: string;
  actionPrompt?: string;
  castAliases?: string[];
  scenePackage?: ScenePackageInput;
  locationProfileId?: string;
  locationFingerprint?: string;
  aspectRatio: AspectRatio16x9;
  style: StylePreset;
  styleIntensity: number;
  camera: string;
};

export type LocationProfile = {
  preset: LocationPreset;
  detail: string;
  geometry: string;
  lightingAndTime: string;
  paletteAndTexture: string;
  fixedProps: string;
  cameraContinuity: string;
};

export type LocationContinuity = {
  lockGeometry: boolean;
  lockLighting: boolean;
  lockPalette: boolean;
  lockProps: boolean;
  lockCameraRules: boolean;
  notes?: string;
};

export type ScenePackageInput = {
  locationProfileId?: string;
  locationProfile: LocationProfile;
  continuity: LocationContinuity;
  shotTemplate: ShotTemplate;
  bilingualInput?: { sourceLanguage: 'hu' | 'en' | 'mixed' };
};
