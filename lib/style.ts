import { StylePreset } from '../types/prompt';

function clampIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) return 65;
  return Math.max(0, Math.min(100, Math.round(intensity)));
}

function getIntensityDirective(intensity: number): string {
  if (intensity <= 20) {
    return 'Apply style very subtly; preserve mostly neutral rendering.';
  }
  if (intensity <= 45) {
    return 'Apply style lightly; keep scene readability and character fidelity dominant.';
  }
  if (intensity <= 70) {
    return 'Apply style at balanced strength; clearly visible stylistic signature.';
  }
  if (intensity <= 90) {
    return 'Apply style strongly; prioritize mood, grading, and texture language.';
  }
  return 'Apply style aggressively; maximize stylization while preserving identity anchors.';
}

const STYLE_PRESETS: Record<StylePreset, string> = {
  gritty: [
    'gritty underground aesthetic',
    'analog film grain',
    'high contrast',
    'dirty textures',
    'cinematic lighting',
    'slight VHS noise',
    'not clean, not polished',
  ].join(',\n'),
  'noir-bw': [
    'black and white film noir look',
    'deep shadows and hard key light',
    'strong chiaroscuro contrast',
    'moody smoke and atmospheric depth',
    'wet streets and reflective highlights',
    'vintage 1940s cinema tone',
  ].join(',\n'),
  'vhs-glitch': [
    'retro VHS analog camera aesthetic',
    'tracking lines and slight signal interference',
    'chromatic aberration and color bleed',
    'timecode-like tape capture vibe',
    'soft analog blur and scanline texture',
    'occasional digital glitch accents',
  ].join(',\n'),
  'neo-noir-neon': [
    'neo noir cinematic style',
    'neon practical lights in cyan and magenta accents',
    'deep blacks with controlled bloom',
    'rainy night reflections and urban mood',
    'stylized high contrast with modern filmic grading',
  ].join(',\n'),
  'dreamy-ethereal': [
    'dreamy ethereal atmosphere',
    'soft diffusion and gentle bloom',
    'pastel-tinted cinematic palette',
    'mist, dust motes and floating ambient particles',
    'poetic composition with delicate light transitions',
  ].join(',\n'),
  'graphic-novel': [
    'graphic novel illustration style',
    'ink-like contour emphasis',
    'bold silhouette readability',
    'posterized contrast and stylized shading',
    'panel-ready dramatic composition',
  ].join(',\n'),
  'police-speed-photo': [
    'roadside Hungarian police speed enforcement camera photo aesthetic, captured in 1999',
    'telephoto compression with long-lens perspective and slight framing misalignment',
    'night-time xenon flash burst with hard frontal illumination and deep background falloff',
    'intentionally degraded late-1990s capture quality: low resolution, visible compression artifacts, interlacing traces, high sensor noise',
    'soft focus and slight motion smear typical of old enforcement hardware',
    'forensic documentary realism with neutral-cool color grading and weak dynamic range',
    'official radar HUD overlay in Hungarian with blocky monochrome text: "SEBESSÉG", "MÉRT", "SÁV", "CÉLPONT"',
    'embedded Hungarian evidence metadata strip: "DÁTUM: 1999.11.xx", "IDŐ", "HELYSZÍN", "MÉRŐESZKÖZ"',
    'roadside context with lane markings and traffic signage, practical non-cinematic composition',
  ].join(',\n'),
};

const STYLE_NEGATIVES: Partial<Record<StylePreset, string[]>> = {
  'noir-bw': ['no full color palette', 'no bright candy colors'],
  'vhs-glitch': ['no pristine digital sharpness', 'no clean modern DSLR look'],
  'graphic-novel': ['no photoreal skin microdetail', 'no smooth airbrushed realism'],
  'police-speed-photo': [
    'no artistic bokeh glamour look',
    'no stylized neon color grading',
    'no cinematic depth-of-field hero framing',
    'no modern smartphone UI elements',
    'no modern high-resolution sharpness',
    'no english UI labels in overlay',
  ],
};

export function getStyleBlock(style: StylePreset = 'gritty', intensity = 65): string {
  const clamped = clampIntensity(intensity);
  return `
[STYLE]
Preset: ${style}
Intensity: ${clamped}/100
Directive: ${getIntensityDirective(clamped)}
${STYLE_PRESETS[style]}
`;
}

export function getNegativeBlock(style: StylePreset = 'gritty', intensity = 65): string {
  const baseNegative = [
    'no extra limbs',
    'no cartoon exaggeration unless requested by style',
    'no clean studio lighting',
    'no character redesign',
  ];
  const styleNegative = STYLE_NEGATIVES[style] || [];
  const clamped = clampIntensity(intensity);
  const intensityNegative = clamped >= 90
    ? ['do not break facial identity and outfit anchors despite heavy stylization']
    : [];

  return `
[NEGATIVE]
${[...baseNegative, ...styleNegative, ...intensityNegative].join(',\n')}
`;
}
