import { createSupabaseServerClient } from './server';
import { createSignedMediaUrl, downloadAsDataUrl } from './media';

export type AppCharacter = {
  id: string;
  ownerId: string | null;
  type: 'system' | 'user';
  name: string;
  description: string;
  traits: string[];
  imagePaths: string[];
  createdAt: number;
};

function normalizeTraits(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

export async function getAppCharacterById(id: string, includeReferenceData = true): Promise<AppCharacter | null> {
  const supabase = await createSupabaseServerClient();
  const { data: character, error } = await supabase
    .from('characters')
    .select('id, owner_id, type, name, description, traits, created_at, character_images(storage_path, image_type)')
    .eq('id', id)
    .maybeSingle();

  if (error || !character) return null;

  const ownerId = character.owner_id as string | null;
  const type = character.type as 'system' | 'user';
  const rows = (character.character_images || []) as Array<{ storage_path: string; image_type: string }>;
  const references = rows
    .filter((row) => row.image_type === 'reference')
    .map((row) => row.storage_path);

  if (!includeReferenceData) {
    return {
      id: character.id,
      ownerId,
      type,
      name: character.name,
      description: character.description,
      traits: normalizeTraits(character.traits),
      imagePaths: [],
      createdAt: new Date(character.created_at).getTime(),
    };
  }

  const imagePaths: string[] = [];
  for (const storagePath of references) {
    try {
      imagePaths.push(await downloadAsDataUrl(storagePath));
    } catch (error) {
      console.error('Reference image download failed:', storagePath, error);
    }
  }

  return {
    id: character.id,
    ownerId,
    type,
    name: character.name,
    description: character.description,
    traits: normalizeTraits(character.traits),
    imagePaths,
    createdAt: new Date(character.created_at).getTime(),
  };
}

export async function getAppCharacters(): Promise<AppCharacter[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('characters')
    .select('id, owner_id, type, name, description, traits, created_at, character_images(storage_path, image_type)')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const results: AppCharacter[] = [];
  for (const character of data) {
    const rows = (character.character_images || []) as Array<{ storage_path: string; image_type: string }>;
    const reference = rows.find((row) => row.image_type === 'reference')?.storage_path;
    let imageUrl = '';
    if (reference) {
      try {
        imageUrl = await createSignedMediaUrl(reference, 3600);
      } catch {
        imageUrl = '';
      }
    }

    results.push({
      id: character.id,
      ownerId: character.owner_id as string | null,
      type: character.type as 'system' | 'user',
      name: character.name,
      description: character.description,
      traits: normalizeTraits(character.traits),
      imagePaths: imageUrl ? [imageUrl] : [],
      createdAt: new Date(character.created_at).getTime(),
    });
  }

  return results;
}
