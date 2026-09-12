import { LocationPreset, SceneInput, ShotTemplate } from '../types/prompt';
import { getPreset, getPresetsByType } from './presetStore';

const MOOD_MAP: Record<string, string> = {
  paras: 'tense, paranoid atmosphere, dim lighting, unease',
  szetesett: 'chaotic, disoriented, unstable framing, motion blur',
  euforikus: 'intense, surreal glow, heightened contrast',
};

export const LOCATION_PRESET_MAP: Record<string, string> = Object.fromEntries(
  getPresetsByType('location').map((preset) => [preset.key, preset.prompt])
);

const SHOT_TEMPLATE_MAP: Record<ShotTemplate, string> = {
  'establishing-wide': 'Establishing wide shot; prioritize spatial readability of the full location.',
  'medium-dialogue': 'Medium dialogue framing; preserve eyeline logic and interaction blocking.',
  'closeup-emotion': 'Close-up emotion shot; preserve facial clarity while keeping environment continuity cues.',
  'over-shoulder': 'Over-the-shoulder composition; maintain axis continuity and readable foreground shoulder silhouette.',
  'insert-detail': 'Insert detail shot; emphasize key object/action while preserving material continuity.',
  'tracking-motion': 'Tracking motion-oriented framing; keep movement believable and spatial continuity intact.',
};

const HU_TO_EN_GLOSSARY: Array<[RegExp, string]> = [
  [/belso\s*ter|belt[eé]r/gi, 'interior space'],
  [/kulso\s*ter|k[uü]lt[eé]r/gi, 'exterior space'],
  [/ejjel|ejszaka/gi, 'night'],
  [/nappal/gi, 'daytime'],
  [/hajnal/gi, 'dawn'],
  [/alkonyat/gi, 'dusk'],
  [/es[oő]/gi, 'rain'],
  [/k[oö]d/gi, 'fog'],
  [/hideg\s*f[eé]ny/gi, 'cold lighting'],
  [/meleg\s*f[eé]ny/gi, 'warm lighting'],
  [/sz[uű]k\s*t[eé]r/gi, 'tight spatial layout'],
  [/t[aá]gas\s*t[eé]r/gi, 'spacious layout'],
  [/koszos|piszkos/gi, 'grimy'],
  [/kopott/gi, 'worn surfaces'],
  [/neon/gi, 'neon accents'],
  [/f[aá]sult/gi, 'fatigued mood'],
];

export function mapMood(input: string): string {
  const key = input.toLowerCase();
  return MOOD_MAP[key] || input;
}

export function normalizeToPromptEnglish(input: string): string {
  const text = String(input || '').trim();
  if (!text) return '';
  let normalized = text;
  for (const [pattern, replacement] of HU_TO_EN_GLOSSARY) normalized = normalized.replace(pattern, replacement);
  return normalized;
}

export function normalizeLocation(location: string): string {
  const normalized = normalizeToPromptEnglish(location);
  if (!normalized) return 'grounded cinematic location, detailed environment, realistic context';
  return `${normalized}, detailed environment, realistic context`;
}

function getLocationPresetPrompt(key: string): string {
  return getPreset('location', key)?.prompt || key;
}

export function buildLocationProfileSummary(scene: SceneInput): string {
  const profile = scene.scenePackage?.locationProfile;
  if (!profile) return normalizeLocation(scene.location);

  const lines: string[] = [];
  if (profile.preset) lines.push(`Preset baseline: ${getLocationPresetPrompt(profile.preset)}`);
  lines.push(
    `Specific detail: ${normalizeToPromptEnglish(profile.detail) || 'not provided'}`,
    `Geometry map: ${normalizeToPromptEnglish(profile.geometry) || 'not provided'}`,
    `Lighting and time: ${normalizeToPromptEnglish(profile.lightingAndTime) || 'not provided'}`,
    `Palette and textures: ${normalizeToPromptEnglish(profile.paletteAndTexture) || 'not provided'}`,
    `Fixed props: ${normalizeToPromptEnglish(profile.fixedProps) || 'not provided'}`,
    `Camera continuity: ${normalizeToPromptEnglish(profile.cameraContinuity) || 'not provided'}`
  );
  return lines.join('\n');
}

export function buildContinuityBlock(scene: SceneInput): string {
  const continuity = scene.scenePackage?.continuity;
  if (!continuity) return '[LOCATION CONTINUITY LOCK]\n- preserve overall location identity and environmental realism between shots';

  const locks: string[] = [];
  if (continuity.lockGeometry) locks.push('lock spatial geometry and layout consistency');
  if (continuity.lockLighting) locks.push('lock lighting direction, intensity, and time-of-day cues');
  if (continuity.lockPalette) locks.push('lock dominant palette and material texture continuity');
  if (continuity.lockProps) locks.push('lock fixed props and keep their relative placement stable');
  if (continuity.lockCameraRules) locks.push('lock camera continuity rules (axis logic, lens feel, framing grammar)');
  if (continuity.notes?.trim()) locks.push(`continuity notes: ${normalizeToPromptEnglish(continuity.notes)}`);
  if (locks.length === 0) locks.push('preserve location continuity from prior shot package');

  return `\n[LOCATION CONTINUITY LOCK]\n${locks.map((line) => `- ${line}`).join('\n')}\n`;
}

export function buildShotTemplateBlock(scene: SceneInput): string {
  const shotTemplate = scene.scenePackage?.shotTemplate;
  if (!shotTemplate) return '[SHOT TEMPLATE]\nDefault cinematic framing behavior; keep continuity with prior scene context.';
  const detail = SHOT_TEMPLATE_MAP[shotTemplate] || shotTemplate;
  return `\n[SHOT TEMPLATE]\n${detail}\n`;
}

function buildFramingBlock(scene: SceneInput): string {
  if (scene.aspectRatio === 'portrait-9-16') {
    return `\n[FRAMING]\nOrientation: portrait (vertical), cinematic 9:16\nRule: fill the entire frame vertically, no landscape composition, no black bars, no letterboxing, no centered tiny subject\nComposition: characters and action must span the height of the frame with readable depth layers\n`;
  }
  return `\n[FRAMING]\nOrientation: landscape (horizontal), cinematic widescreen 16:9\nRule: fill the entire frame horizontally, no portrait composition, no black bars, no letterboxing, no centered vertical subject\nComposition: characters and action must span the width of the frame\n`;
}

export function buildSceneBlock(scene: SceneInput): string {
  const cast = scene.castAliases && scene.castAliases.length > 1 ? scene.castAliases.join(', ') : null;
  const actionLine = scene.actionPrompt ? `Action prompt: ${scene.actionPrompt}` : 'Action prompt: not provided';
  return `\n[SCENE]\nLocation:\n${buildLocationProfileSummary(scene)}\nMood: ${normalizeToPromptEnglish(mapMood(scene.mood))}\n${actionLine}\n\n${buildFramingBlock(scene)}\n\n${buildShotTemplateBlock(scene)}\n\n${buildContinuityBlock(scene)}\n\n[INTERACTION]\n${cast ? `Characters ${cast} are naturally integrated into the scene, with believable spacing and body language` : 'Character is naturally integrated into the scene, not posing artificially'}\n`;
}

export { MOOD_MAP };
