import { SceneInput } from '../types/prompt';
import { getPreset, getPresetsByType } from './presetStore';

export const CAMERA_PRESETS: Record<string | SceneInput['camera'], string> = Object.fromEntries(
  getPresetsByType('camera').map((preset) => [preset.key, preset.prompt])
);

export function getCamera(camera: SceneInput['camera'] | string): string {
  const presetKey = String(camera || 'wide');
  const preset = getPreset('camera', presetKey) || getPreset('camera', 'wide');
  return `[CAMERA]\n${preset?.prompt || ''}`;
}
