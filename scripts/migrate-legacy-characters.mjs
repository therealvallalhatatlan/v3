import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageDir = process.env.STORAGE_DIR || 'E:/ai-storage';
const limit = Number(process.env.LEGACY_CHARACTER_LIMIT || process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 2);

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
  console.error('Legacy characters.json is empty.');
  process.exit(1);
}

const selected = raw.slice(0, Math.max(1, limit));
console.log(`Found ${raw.length} legacy characters. Importing ${selected.length} as system characters.`);

const mapping = [];

for (const legacy of selected) {
  const id = crypto.randomUUID();
  const sourceId = String(legacy.id || '');
  const characterDir = path.join(storageDir, 'images', sourceId);

  const { data: character, error: characterError } = await supabase
    .from('characters')
    .insert({
      id,
      owner_id: null,
      type: 'system',
      name: String(legacy.name || 'Unnamed character').slice(0, 120),
      description: String(legacy.description || '').slice(0, 4000),
      traits: Array.isArray(legacy.traits) ? legacy.traits.map(String).slice(0, 30) : [],
    })
    .select('id, name')
    .single();

  if (characterError) {
    console.error(`Failed to create ${legacy.name}: ${characterError.message}`);
    continue;
  }

  const sourcePaths = Array.isArray(legacy.imagePaths) ? legacy.imagePaths : [];
  const files = [];
  if (fs.existsSync(characterDir)) {
    for (const entry of fs.readdirSync(characterDir)) {
      const full = path.join(characterDir, entry);
      if (fs.statSync(full).isFile() && /\.(png|jpe?g|webp|gif)$/i.test(entry)) {
        files.push(full);
      }
    }
  }

  const uploaded = [];
  for (let index = 0; index < Math.max(files.length, sourcePaths.length); index += 1) {
    const filePath = files[index];
    if (!filePath) continue;

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.webp' ? 'image/webp' :
      ext === '.gif' ? 'image/gif' :
      'image/png';

    const storagePath = `system/characters/${id}/references/${index + 1}${ext || '.png'}`;
    const buffer = fs.readFileSync(filePath);

    const { error: uploadError } = await supabase.storage
      .from('v3-media')
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error(`Failed to upload ${filePath}: ${uploadError.message}`);
      continue;
    }

    uploaded.push(storagePath);
  }

  if (uploaded.length) {
    const { error: imageRowsError } = await supabase.from('character_images').insert(
      uploaded.map((storagePath) => ({
        character_id: id,
        storage_path: storagePath,
        image_type: 'reference',
      }))
    );

    if (imageRowsError) {
      console.error(`Failed to save reference rows for ${legacy.name}: ${imageRowsError.message}`);
    }
  }

  mapping.push({
    legacyId: sourceId,
    newId: character.id,
    name: character.name,
    uploadedReferences: uploaded.length,
  });

  console.log(`Imported: ${character.name} (${uploaded.length} reference images)`);
}

const output = path.join(process.cwd(), 'migration-result.json');
fs.writeFileSync(output, JSON.stringify(mapping, null, 2), 'utf8');
console.log(`Done. Mapping written to ${output}`);
