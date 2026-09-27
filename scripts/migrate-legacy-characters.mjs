import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageDir = process.env.STORAGE_DIR || 'E:/ai-storage';
const limit = Number(
  process.env.LEGACY_CHARACTER_LIMIT ||
    process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ||
    2
);

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const charactersFile = path.join(storageDir, 'characters.json');

if (!fs.existsSync(charactersFile)) {
  console.error(`Legacy characters.json not found: ${charactersFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(charactersFile, 'utf8'));

if (!Array.isArray(raw) || raw.length === 0) {
  console.error('Legacy characters.json is empty or is not an array.');
  process.exit(1);
}

const selected = raw.slice(0, Math.max(1, limit));

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') {
    throw new Error('Reference image is not a string.');
  }

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);

  if (!match) {
    throw new Error('Reference image is not a supported base64 data URL.');
  }

  const contentType = match[1].toLowerCase();
  const base64 = match[2].replace(/\s/g, '');
  const buffer = Buffer.from(base64, 'base64');

  if (!buffer.length) {
    throw new Error('Reference image decoded to an empty buffer.');
  }

  const extensionByMime = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  const ext = extensionByMime[contentType];

  if (!ext) {
    throw new Error(`Unsupported reference image type: ${contentType}`);
  }

  return { buffer, contentType, ext };
}

const mapping = [];

for (const legacy of selected) {
  const legacyId = String(legacy.id || '');

  if (!legacyId) {
    console.error('Skipping legacy character without an id.');
    continue;
  }

  const name = String(legacy.name || 'Unnamed character').slice(0, 120);
  const description = String(legacy.description || '').slice(0, 4000);
  const traits = Array.isArray(legacy.traits)
    ? legacy.traits.map(String).slice(0, 30)
    : [];
  const imagePaths = Array.isArray(legacy.imagePaths)
    ? legacy.imagePaths.filter(Boolean)
    : [];

  let characterId = legacyId;

  const { data: existing, error: existingError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .maybeSingle();

  if (existingError) {
    console.error(`Failed to inspect ${name}: ${existingError.message}`);
    continue;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('characters')
      .update({
        owner_id: null,
        type: 'system',
        name,
        description,
        traits,
      })
      .eq('id', characterId);

    if (updateError) {
      console.error(`Failed to update ${name}: ${updateError.message}`);
      continue;
    }
  } else {
    const { error: insertError } = await supabase.from('characters').insert({
      id: characterId,
      owner_id: null,
      type: 'system',
      name,
      description,
      traits,
    });

    if (insertError) {
      console.error(`Failed to create ${name}: ${insertError.message}`);
      continue;
    }
  }

  const { data: existingImages, error: existingImagesError } = await supabase
    .from('character_images')
    .select('storage_path')
    .eq('character_id', characterId);

  if (existingImagesError) {
    console.error(`Failed to inspect reference rows for ${name}: ${existingImagesError.message}`);
    continue;
  }

  const oldPaths = (existingImages || [])
    .map((row) => row.storage_path)
    .filter(Boolean);

  if (oldPaths.length) {
    const { error: removeStorageError } = await supabase.storage
      .from('v3-media')
      .remove(oldPaths);

    if (removeStorageError) {
      console.error(`Failed to remove old references for ${name}: ${removeStorageError.message}`);
      continue;
    }

    const { error: removeRowsError } = await supabase
      .from('character_images')
      .delete()
      .eq('character_id', characterId);

    if (removeRowsError) {
      console.error(`Failed to remove old reference rows for ${name}: ${removeRowsError.message}`);
      continue;
    }
  }

  const uploaded = [];

  for (let index = 0; index < imagePaths.length; index += 1) {
    const { buffer, contentType, ext } = parseDataUrl(imagePaths[index]);
    const storagePath = `system/characters/${characterId}/references/${index + 1}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('v3-media')
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error(`Failed to upload reference ${index + 1} for ${name}: ${uploadError.message}`);
      continue;
    }

    uploaded.push(storagePath);
  }

  if (uploaded.length) {
    const { error: imageRowsError } = await supabase.from('character_images').insert(
      uploaded.map((storagePath) => ({
        character_id: characterId,
        storage_path: storagePath,
        image_type: 'reference',
      }))
    );

    if (imageRowsError) {
      console.error(`Failed to save reference rows for ${name}: ${imageRowsError.message}`);
      continue;
    }
  }

  mapping.push({
    legacyId,
    newId: characterId,
    name,
    referenceCount: imagePaths.length,
    uploadedReferences: uploaded.length,
    storagePaths: uploaded,
  });

  console.log(`Imported: ${name} (${uploaded.length}/${imagePaths.length} reference images)`);
}

const output = path.join(process.cwd(), 'migration-result.json');
fs.writeFileSync(output, JSON.stringify(mapping, null, 2), 'utf8');

console.log(`Done. Mapping written to ${output}`);
