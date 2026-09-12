'use client';

import { useEffect, useMemo, useState } from 'react';

 type PresetType = 'location' | 'camera' | 'style';
 type CustomPreset = {
  id: string;
  type: PresetType;
  key: string;
  label: string;
  prompt: string;
  negative?: string;
  createdAt: number;
  updatedAt: number;
};

type PresetOption = {
  value: string;
  label: string;
  prompt: string;
  negative?: string;
  builtin?: boolean;
  id?: string;
};

const TYPE_LABELS: Record<PresetType, string> = {
  location: 'Location Preset',
  camera: 'Camera',
  style: 'Style',
};

const EMPTY_FORM = {
  type: 'location' as PresetType,
  key: '',
  label: '',
  prompt: '',
  negative: '',
};

export default function PresetsPage() {
  const [activeType, setActiveType] = useState<PresetType>('location');
  const [options, setOptions] = useState<Record<PresetType, PresetOption[]>>({ location: [], camera: [], style: [] });
  const [custom, setCustom] = useState<CustomPreset[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const customForType = useMemo(
    () => custom.filter((preset) => preset.type === activeType),
    [custom, activeType]
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/presets', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load presets');
      setOptions(data.presets || { location: [], camera: [], style: [] });
      setCustom(Array.isArray(data.custom) ? data.custom : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load presets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = (type = activeType) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setMessage('');
    setError('');
  };

  const startEdit = (preset: CustomPreset) => {
    setActiveType(preset.type);
    setEditingId(preset.id);
    setForm({
      type: preset.type,
      key: preset.key,
      label: preset.label,
      prompt: preset.prompt,
      negative: preset.negative || '',
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/presets', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, key: form.key, label: form.label, prompt: form.prompt, negative: form.negative } : form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save preset');
      setMessage(editingId ? 'Preset updated.' : 'Preset created. It is now available in the generator.');
      await load();
      resetForm(form.type);
    } catch (e: any) {
      setError(e.message || 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (preset: CustomPreset) => {
    if (!window.confirm(`Delete custom preset "${preset.label}"?`)) return;
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/presets?id=${encodeURIComponent(preset.id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete preset');
      if (editingId === preset.id) resetForm(preset.type);
      await load();
      setMessage('Preset deleted.');
    } catch (e: any) {
      setError(e.message || 'Failed to delete preset');
    }
  };

  const currentBuiltins = options[activeType].filter((preset) => preset.builtin);

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-indigo-400 mb-2">Configuration</div>
            <h1 className="text-3xl md:text-4xl font-bold">Preset Manager</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              Add new Location, Camera and Style presets without touching the TypeScript source code.
              Custom presets are stored in the configured server storage directory.
            </p>
          </div>
          <a href="/" className="text-sm px-3 py-2 rounded border border-gray-700 hover:border-gray-500">← Characters</a>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex gap-1 p-1 bg-gray-800 rounded-lg mb-5">
              {(Object.keys(TYPE_LABELS) as PresetType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setActiveType(type); resetForm(type); }}
                  className={`flex-1 px-3 py-2 rounded text-xs font-semibold ${activeType === type ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  {type === 'location' ? 'Location' : type === 'camera' ? 'Camera' : 'Style'}
                </button>
              ))}
            </div>

            <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit custom preset' : `Add ${TYPE_LABELS[activeType]}`}</h2>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Key</label>
                <input
                  required
                  disabled={Boolean(editingId)}
                  value={form.key}
                  onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g. abandoned-mall"
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                />
                <div className="text-[11px] text-gray-500 mt-1">2–64 chars, lowercase letters, numbers and hyphens.</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Label</label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder={activeType === 'location' ? 'Abandoned Shopping Mall' : activeType === 'camera' ? 'Disposable Camera Flash' : 'Dirty Point-and-Shoot'}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Prompt</label>
                <textarea
                  required
                  rows={8}
                  value={form.prompt}
                  onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder="The actual prompt language sent to Gemini when this preset is selected."
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                />
              </div>

              {activeType === 'style' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Negative prompt <span className="text-gray-500">(optional)</span></label>
                  <textarea
                    rows={4}
                    value={form.negative}
                    onChange={(e) => setForm((prev) => ({ ...prev, negative: e.target.value }))}
                    placeholder="Things this style should avoid, comma or newline separated."
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-sm"
                  />
                </div>
              )}

              {error && <div className="text-sm text-red-300 bg-red-950/40 border border-red-900 rounded p-2">{error}</div>}
              {message && <div className="text-sm text-green-300 bg-green-950/30 border border-green-900 rounded p-2">{message}</div>}

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-sm font-semibold">
                  {saving ? 'Saving…' : editingId ? 'Update preset' : 'Add preset'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => resetForm(activeType)} className="px-4 py-2 rounded border border-gray-700 hover:border-gray-500 text-sm">Cancel</button>
                )}
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold">{TYPE_LABELS[activeType]}</h2>
                  <p className="text-xs text-gray-500 mt-1">Built-in presets are read-only. Custom presets are editable.</p>
                </div>
                <button type="button" onClick={load} className="text-xs px-3 py-2 rounded border border-gray-700 hover:border-gray-500">Refresh</button>
              </div>

              {loading ? (
                <div className="text-sm text-gray-500">Loading presets…</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentBuiltins.map((preset) => (
                    <div key={preset.value} className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-sm">{preset.label}</div>
                        <span className="text-[10px] uppercase tracking-wide text-gray-500">Built-in</span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">{preset.value || '(empty key)'}</div>
                    </div>
                  ))}

                  {customForType.map((preset) => (
                    <div key={preset.id} className="rounded-lg border border-indigo-900/60 bg-indigo-950/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-sm">{preset.label}</div>
                          <div className="text-[11px] text-indigo-300/70 mt-1">{preset.key}</div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-indigo-400">Custom</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-3 line-clamp-4 whitespace-pre-wrap">{preset.prompt}</div>
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => startEdit(preset)} className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-xs">Edit</button>
                        <button type="button" onClick={() => remove(preset)} className="px-3 py-1.5 rounded border border-gray-700 hover:border-red-500 hover:text-red-300 text-xs">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 text-sm text-gray-400">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">How it works</div>
              <p>New presets are written to <code className="text-gray-300">&lt;STORAGE_DIR&gt;/presets.json</code>. The generator loads them at runtime, while the original built-in presets continue to work unchanged.</p>
              <p className="mt-2">After adding one here, refresh the character generator. No code edit or rebuild is required.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
