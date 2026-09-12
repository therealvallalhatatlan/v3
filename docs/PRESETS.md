# Preset system

The image generator uses a runtime preset catalog for **Location Preset**, **Camera**, and **Style**.

## Where presets are stored

Presets are persisted in:

```text
<STORAGE_DIR>/presets.json
```

The first server-side read automatically migrates the existing built-in presets into this file. From then on, `presets.json` is the runtime source of truth.

## Manage presets

Open:

```text
/presets
```

From the Preset Manager you can:

- Add custom presets
- Edit built-in presets
- Edit custom presets
- Duplicate any preset into a new custom preset
- Reset a built-in preset to its original values
- Delete custom presets

Built-in keys are intentionally locked. This prevents old saved generation forms from breaking when a built-in preset is renamed internally. The visible label and prompt remain fully editable.

## Preset record

A preset has the following shape:

```json
{
  "id": "builtin-camera-wide",
  "type": "camera",
  "key": "wide",
  "label": "Wide",
  "prompt": "cinematic wide establishing shot...",
  "negative": "",
  "builtin": true,
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

`type` is one of:

```text
location
camera
style
```

`key` is the runtime identifier used by generation requests. New custom keys must contain lowercase letters, numbers and hyphens and be 2–64 characters long, except the empty Location key used by the built-in blank location preset.

## Runtime behavior

The generator does not hard-code the active prompt for a preset anymore. It resolves the selected key through the preset store.

For example:

```text
Camera key: wide
        ↓
getPreset('camera', 'wide')
        ↓
current prompt from presets.json
        ↓
[CAMERA] block
```

The same mechanism is used for Location and Style presets. Style presets may additionally supply a negative prompt.

## API

`GET /api/presets`

Returns all effective presets grouped by type.

`POST /api/presets`

Creates a custom preset. Example:

```json
{
  "type": "camera",
  "key": "disposable-camera-flash",
  "label": "Disposable Camera Flash",
  "prompt": "cheap late-1990s disposable camera perspective, direct on-camera flash..."
}
```

`PATCH /api/presets`

Updates a preset:

```json
{
  "id": "builtin-camera-wide",
  "label": "Wide Documentary",
  "prompt": "..."
}
```

Actions are also supported:

```json
{ "id": "builtin-camera-wide", "action": "reset" }
```

```json
{ "id": "builtin-camera-wide", "action": "duplicate" }
```

`DELETE /api/presets?id=<id>`

Deletes a custom preset. Built-in presets are protected and must be reset instead.

## Adding a new preset

1. Open `/presets`.
2. Select Location, Camera, or Style.
3. Enter a unique key.
4. Enter the visible label.
5. Write the prompt used for generation.
6. For Style, optionally add a negative prompt.
7. Save.

The new preset becomes available to the generator after its preset catalog is refreshed. No TypeScript change is required.

## Editing a built-in preset

Choose the preset and click **Edit**. Change the label, prompt, or Style negative prompt and save.

The original preset definition remains available through **Reset**. Reset restores the original built-in label, prompt, and negative prompt.

## Architecture

```text
lib/presetCatalog.ts   original built-in definitions
        ↓
lib/presetStore.ts     migration + persistence + runtime lookup
        ↓
/api/presets            CRUD API
        ↓
/app/presets             admin UI
        ↓
Generator / prompt engine
```

The original built-in definitions remain in `presetCatalog.ts` as the factory defaults. They are no longer the runtime prompt source after migration.
