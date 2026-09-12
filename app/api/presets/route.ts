import { NextRequest, NextResponse } from 'next/server';
import { CAMERA_PRESETS } from '../../../lib/camera';
import { LOCATION_PRESET_MAP } from '../../../lib/sceneMapper';
import { STYLE_PRESETS } from '../../../lib/style';
import {
  addCustomPreset,
  CustomPreset,
  deleteCustomPreset,
  getCustomPresets,
  updateCustomPreset,
} from '../../../lib/presetStore';

type PresetOption = {
  value: string;
  label: string;
  prompt: string;
  negative?: string;
  builtin?: boolean;
  id?: string;
};

function titleFromKey(key: string): string {
  if (!key) return 'Empty preset';
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function customToOption(preset: CustomPreset): PresetOption {
  return {
    value: preset.key,
    label: preset.label,
    prompt: preset.prompt,
    negative: preset.negative,
    builtin: false,
    id: preset.id,
  };
}

function builtins(): { location: PresetOption[]; camera: PresetOption[]; style: PresetOption[] } {
  return {
    location: Object.entries(LOCATION_PRESET_MAP).map(([value, prompt]) => ({
      value,
      label: value === '' ? 'Üres preset' : titleFromKey(value),
      prompt,
      builtin: true,
    })),
    camera: Object.entries(CAMERA_PRESETS).map(([value, prompt]) => ({
      value,
      label: value === 'closeup' ? 'Close-up' : titleFromKey(value),
      prompt,
      builtin: true,
    })),
    style: Object.entries(STYLE_PRESETS).map(([value, prompt]) => ({
      value,
      label: value === 'gritty' ? 'Gritty Underground (Default)' : titleFromKey(value),
      prompt,
      builtin: true,
    })),
  };
}

function keyIsValid(key: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(key);
}

function normalizeBody(body: any) {
  const type = String(body?.type || '').trim();
  const key = String(body?.key || '').trim().toLowerCase();
  const label = String(body?.label || '').trim();
  const prompt = String(body?.prompt || '').trim();
  const negative = String(body?.negative || '').trim();
  if (!['location', 'camera', 'style'].includes(type)) throw new Error('type must be location, camera or style');
  if (!keyIsValid(key)) throw new Error('key must be 2-64 chars: lowercase letters, numbers and hyphens');
  if (!label || label.length > 120) throw new Error('label is required and must be <= 120 characters');
  if (!prompt || prompt.length > 6000) throw new Error('prompt is required and must be <= 6000 characters');
  if (negative.length > 3000) throw new Error('negative must be <= 3000 characters');
  return { type: type as 'location' | 'camera' | 'style', key, label, prompt, negative: negative || undefined };
}

function keyTaken(type: CustomPreset['type'], key: string, exceptId?: string): boolean {
  const defaults = builtins()[type].some((preset) => preset.value === key);
  if (defaults) return true;
  return getCustomPresets().some((preset) => preset.type === type && preset.key === key && preset.id !== exceptId);
}

export async function GET() {
  const defaults = builtins();
  const custom = getCustomPresets();
  const customByType = {
    location: custom.filter((p) => p.type === 'location').map(customToOption),
    camera: custom.filter((p) => p.type === 'camera').map(customToOption),
    style: custom.filter((p) => p.type === 'style').map(customToOption),
  };

  return NextResponse.json({
    presets: {
      location: [...defaults.location, ...customByType.location],
      camera: [...defaults.camera, ...customByType.camera],
      style: [...defaults.style, ...customByType.style],
    },
    custom,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalized = normalizeBody(body);
    if (keyTaken(normalized.type, normalized.key)) {
      return NextResponse.json({ error: 'A preset with this key already exists.' }, { status: 409 });
    }
    const created = addCustomPreset(normalized);
    return NextResponse.json({ preset: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create preset' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const current = getCustomPresets().find((preset) => preset.id === id);
    if (!current) return NextResponse.json({ error: 'Custom preset not found' }, { status: 404 });

    const candidate = {
      type: current.type,
      key: body?.key === undefined ? current.key : String(body.key).trim().toLowerCase(),
      label: body?.label === undefined ? current.label : String(body.label).trim(),
      prompt: body?.prompt === undefined ? current.prompt : String(body.prompt).trim(),
      negative: body?.negative === undefined ? current.negative : String(body.negative || '').trim() || undefined,
    };
    if (!keyIsValid(candidate.key)) return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    if (!candidate.label || candidate.label.length > 120) return NextResponse.json({ error: 'Invalid label' }, { status: 400 });
    if (!candidate.prompt || candidate.prompt.length > 6000) return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    if (candidate.negative && candidate.negative.length > 3000) return NextResponse.json({ error: 'Invalid negative prompt' }, { status: 400 });
    if (keyTaken(candidate.type, candidate.key, id)) return NextResponse.json({ error: 'A preset with this key already exists.' }, { status: 409 });

    const updated = updateCustomPreset(id, {
      key: candidate.key,
      label: candidate.label,
      prompt: candidate.prompt,
      negative: candidate.negative,
    });
    return NextResponse.json({ preset: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update preset' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const removed = deleteCustomPreset(id);
  if (!removed) return NextResponse.json({ error: 'Custom preset not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
