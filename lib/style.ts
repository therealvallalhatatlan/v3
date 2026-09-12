import { StylePreset } from '../types/prompt';
import { getPreset, getPresetsByType } from './presetStore';

function clampIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) return 65;
  return Math.max(0, Math.min(100, Math.round(intensity)));
}

function getIntensityDirective(intensity: number): string {
  if (intensity <= 20) return 'Apply style very subtly; preserve mostly neutral rendering.';
  if (intensity <= 45) return 'Apply style lightly; keep scene readability and character fidelity dominant.';
  if (intensity <= 70) return 'Apply style at balanced strength; clearly visible stylistic signature.';
  if (intensity <= 90) return 'Apply style strongly; prioritize mood, grading, and texture language.';
  return 'Apply style aggressively; maximize stylization while preserving identity anchors.';
}

export const STYLE_PRESETS: Record<string, string> = Object.fromEntries(
  getPresetsByType('style').map((preset) => [preset.key, preset.prompt])
);

export const STYLE_NEGATIVES: Record<string, string[]> = Object.fromEntries(
  getPresetsByType('style')
    .filter((preset) => preset.negative)
    .map((preset) => [preset.key, preset.negative!.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)])
);

export function getStyleBlock(style: StylePreset = 'gritty', intensity = 65): string {
  const clamped = clampIntensity(intensity);
  const key = String(style || 'gritty');
  const preset = getPreset('style', key) || getPreset('style', 'gritty');
  return `
[STYLE]
Preset: ${key}
Intensity: ${clamped}/100
Directive: ${getIntensityDirective(clamped)}
${preset?.prompt || ''}
`;
}

export function getNegativeBlock(style: StylePreset = 'gritty', intensity = 65): string {
  const baseNegative = ['no extra limbs', 'no cartoon exaggeration unless requested by style', 'no clean studio lighting', 'no character redesign'];
  const key = String(style || 'gritty');
  const preset = getPreset('style', key) || getPreset('style', 'gritty');
  const styleNegative = preset?.negative
    ? preset.negative.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
    : STYLE_NEGATIVES[key] || [];
  const clamped = clampIntensity(intensity);
  const intensityNegative = clamped >= 90
    ? ['do not break facial identity and outfit anchors despite heavy stylization']
    : [];

  return `
[NEGATIVE]
${[...baseNegative, ...styleNegative, ...intensityNegative].join(',\n')}
`;
}
