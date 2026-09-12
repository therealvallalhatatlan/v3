import { readJSON, writeJSON } from './fileUtils';
import { initStorage } from './paths';

export type PresetType = 'location' | 'camera' | 'style';

export type CustomPreset = {
  id: string;
  type: PresetType;
  key: string;
  label: string;
  prompt: string;
  negative?: string;
  createdAt: number;
  updatedAt: number;
};

const PRESETS_FILE = 'presets.json';

function normalizePreset(raw: any): CustomPreset | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!['location', 'camera', 'style'].includes(raw.type)) return null;
  const key = String(raw.key || '').trim();
  const label = String(raw.label || '').trim();
  const prompt = String(raw.prompt || '').trim();
  if (!key || !label || !prompt) return null;
  return {
    id: String(raw.id || `${raw.type}-${key}`),
    type: raw.type as PresetType,
    key,
    label,
    prompt,
    negative: String(raw.negative || '').trim() || undefined,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function getCustomPresets(): CustomPreset[] {
  initStorage();
  const raw = readJSON<any>(PRESETS_FILE);
  const values = Array.isArray(raw) ? raw : Array.isArray(raw?.presets) ? raw.presets : [];
  return values
    .map(normalizePreset)
    .filter((preset): preset is CustomPreset => Boolean(preset));
}

export function getCustomPreset(type: PresetType, key: string): CustomPreset | undefined {
  return getCustomPresets().find((preset) => preset.type === type && preset.key === key);
}

export function saveCustomPresets(presets: CustomPreset[]): void {
  initStorage();
  writeJSON(PRESETS_FILE, presets);
}

export function addCustomPreset(input: Omit<CustomPreset, 'id' | 'createdAt' | 'updatedAt'>): CustomPreset {
  const now = Date.now();
  const preset: CustomPreset = {
    ...input,
    id: `custom-${input.type}-${input.key}-${now.toString(36)}`,
    createdAt: now,
    updatedAt: now,
  };
  saveCustomPresets([...getCustomPresets(), preset]);
  return preset;
}

export function updateCustomPreset(id: string, updates: Partial<Pick<CustomPreset, 'label' | 'prompt' | 'negative' | 'key'>>): CustomPreset | null {
  const current = getCustomPresets();
  const index = current.findIndex((preset) => preset.id === id);
  if (index < 0) return null;
  const updated: CustomPreset = {
    ...current[index],
    ...updates,
    key: String(updates.key ?? current[index].key).trim(),
    label: String(updates.label ?? current[index].label).trim(),
    prompt: String(updates.prompt ?? current[index].prompt).trim(),
    negative: String(updates.negative ?? current[index].negative ?? '').trim() || undefined,
    updatedAt: Date.now(),
  };
  current[index] = updated;
  saveCustomPresets(current);
  return updated;
}

export function deleteCustomPreset(id: string): boolean {
  const current = getCustomPresets();
  const next = current.filter((preset) => preset.id !== id);
  if (next.length === current.length) return false;
  saveCustomPresets(next);
  return true;
}

export function hasCustomPreset(type: PresetType, key: string): boolean {
  return Boolean(getCustomPreset(type, key));
}
