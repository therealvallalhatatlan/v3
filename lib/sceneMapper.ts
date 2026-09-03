import { LocationPreset, SceneInput, ShotTemplate } from '../types/prompt';

const MOOD_MAP: Record<string, string> = {
  paras: "tense, paranoid atmosphere, dim lighting, unease",
  szetesett: "chaotic, disoriented, unstable framing, motion blur",
  euforikus: "intense, surreal glow, heightened contrast",
};

const LOCATION_PRESET_MAP: Record<LocationPreset, string> = {
  '': '',
  'urban-street': 'dense Budapest urban street, late 1990s to early 2000s, layered storefronts, period-correct signage and lived-in city texture',
  apartment: 'small Budapest apartment interior, late 1990s to early 2000s, practical furniture and period-accurate daily-life clutter',
  office: 'functional Budapest office interior, late 1990s to early 2000s, grounded corporate realism with era-appropriate fixtures',
  warehouse: 'Budapest industrial warehouse, late 1990s to early 2000s, hard surfaces, ambient dust, and period-correct utility details',
  rooftop: 'Budapest city rooftop, late 1990s to early 2000s, skyline depth, wind exposure, and practical safety details',
  subway: 'Budapest underground metro station, late 1990s to early 2000s, repeating geometry, public-transport wear, era-accurate materials',
  forest: 'forest edge around Budapest, late 1990s to early 2000s, layered vegetation with realistic regional atmosphere',
  'industrial-yard': 'Budapest industrial yard, late 1990s to early 2000s, rugged materials, heavy-equipment traces, and period utility clutter',
  'night-highway': 'Budapest night highway corridor, late 1990s to early 2000s, practical road infrastructure and sodium-vapor style lighting',
  'interrogation-room': 'minimal Budapest interrogation room, late 1990s to early 2000s, controlled lighting, sparse furniture, period institutional finish',
  budai: 'Budai upper-middle-class room, late 1990s to early 2000s, inherited grandmother-era furniture, heavy wood pieces, floral upholstery, framed family portraits, layered wallpaper, antique lamps, side tables, and a lived-in but elegant bourgeois domestic atmosphere',
  bevasarlokozpont: 'interior of a Budapest H&M-style clothing store, 1999 to early 2000s, mirror-heavy layout, mannequins throughout, realistic retail staging',
  'vaulted-cellar-server-room': 'vaulted brick cellar interior, underground bunker-like room, thick brick walls, cable bundles snaking across the walls, floor, and ceiling, monitors and machines lining the perimeter, old arcade gaming cabinets and retro amusement machines packed shoulder to shoulder, stacked crates and cluttered salvage piled high, central sofa and armchairs with a small coffee table, chaotic clutter everywhere, ominous satanic motifs and occult symbols, posters and old prints pinned across the walls, grimy industrial atmosphere with a lived-in, overloaded technology den feel',
  'mcdonalds-east-eu-2000': 'East-European McDonalds interior, late 1990s to early 2000s, tiled floors, plastic seating, bright menu lightboxes, tray-based fast-food setup, era-authentic branding and lived-in public atmosphere',
  'land-rover-interior-pov': 'inside a battered old Land Rover interior, POV from the cabin, torn upholstery, cracked dashboard, worn controls, dusty glass, exposed metal, off-road fatigue, cramped vehicle geometry',
  'white-studio-sofa': 'bright white studio backdrop, clean minimalist composition, one oversized turn-of-the-century sofa as the only major furniture piece, scattered throw pillows and blankets on the floor, soft neutral palette, open negative space, polished modern calm',
  'hotel-courtyard-pool-cocktail-bar': 'hotel inner courtyard with swimming pool under summer sunshine, ending in a cocktail bar at the far end of the pool',
};

const SHOT_TEMPLATE_MAP: Record<ShotTemplate, string> = {
  'establishing-wide': 'Establishing wide shot; prioritize spatial readability of the full location.',
  'medium-dialogue': 'Medium dialogue framing; preserve eyeline logic and interaction blocking.',
  'closeup-emotion': 'Close-up emotion shot; preserve facial clarity while keeping environment continuity cues.',
  'over-shoulder': 'Over-the-shoulder composition; maintain axis continuity and readable foreground shoulder silhouette.',
  'insert-detail': 'Insert detail shot; emphasize key object/action while preserving material continuity.',
  'tracking-motion': 'Tracking motion-orientedn framing; keep movement believable and spatial continuity intact.',
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
  for (const [pattern, replacement] of HU_TO_EN_GLOSSARY) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Keep user intent while nudging toward stable, model-friendly prompt English.
  return normalized;
}

export function normalizeLocation(location: string): string {
  const normalized = normalizeToPromptEnglish(location);
  if (!normalized) {
    return 'grounded cinematic location, detailed environment, realistic context';
  }
  return `${normalized}, detailed environment, realistic context`;
}

export function buildLocationProfileSummary(scene: SceneInput): string {
  const profile = scene.scenePackage?.locationProfile;
  if (!profile) {
    return normalizeLocation(scene.location);
  }
  const lines: string[] = [];
  if (profile.preset) {
    const presetLine = LOCATION_PRESET_MAP[profile.preset] || profile.preset;
    lines.push(`Preset baseline: ${presetLine}`);
  }
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
  if (!continuity) {
    return '[LOCATION CONTINUITY LOCK]\n- preserve overall location identity and environmental realism between shots';
  }

  const locks: string[] = [];
  if (continuity.lockGeometry) locks.push('lock spatial geometry and layout consistency');
  if (continuity.lockLighting) locks.push('lock lighting direction, intensity, and time-of-day cues');
  if (continuity.lockPalette) locks.push('lock dominant palette and material texture continuity');
  if (continuity.lockProps) locks.push('lock fixed props and keep their relative placement stable');
  if (continuity.lockCameraRules) locks.push('lock camera continuity rules (axis logic, lens feel, framing grammar)');
  if (continuity.notes?.trim()) {
    locks.push(`continuity notes: ${normalizeToPromptEnglish(continuity.notes)}`);
  }

  if (locks.length === 0) {
    locks.push('preserve location continuity from prior shot package');
  }

  return `
[LOCATION CONTINUITY LOCK]
${locks.map((line) => `- ${line}`).join('\n')}
`;
}

export function buildShotTemplateBlock(scene: SceneInput): string {
  const shotTemplate = scene.scenePackage?.shotTemplate;
  if (!shotTemplate) {
    return '[SHOT TEMPLATE]\nDefault cinematic framing behavior; keep continuity with prior scene context.';
  }
  const detail = SHOT_TEMPLATE_MAP[shotTemplate] || shotTemplate;
  return `
[SHOT TEMPLATE]
${detail}
`;
}

function buildFramingBlock(scene: SceneInput): string {
  if (scene.aspectRatio === 'portrait-9-16') {
    return `
[FRAMING]
Orientation: portrait (vertical), cinematic 9:16
Rule: fill the entire frame vertically, no landscape composition, no black bars, no letterboxing, no centered tiny subject
Composition: characters and action must span the height of the frame with readable depth layers
`;
  }

  return `
[FRAMING]
Orientation: landscape (horizontal), cinematic widescreen 16:9
Rule: fill the entire frame horizontally, no portrait composition, no black bars, no letterboxing, no centered vertical subject
Composition: characters and action must span the width of the frame
`;
}

export function buildSceneBlock(scene: SceneInput): string {
  const cast = scene.castAliases && scene.castAliases.length > 1
    ? scene.castAliases.join(', ')
    : null;
  const actionLine = scene.actionPrompt
    ? `Action prompt: ${scene.actionPrompt}`
    : 'Action prompt: not provided';

  return `
[SCENE]
Location:\n${buildLocationProfileSummary(scene)}
Mood: ${normalizeToPromptEnglish(mapMood(scene.mood))}
${actionLine}

${buildFramingBlock(scene)}

${buildShotTemplateBlock(scene)}

${buildContinuityBlock(scene)}

[INTERACTION]
${cast
    ? `Characters ${cast} are naturally integrated into the scene, with believable spacing and body language`
    : 'Character is naturally integrated into the scene, not posing artificially'}
`;
}
