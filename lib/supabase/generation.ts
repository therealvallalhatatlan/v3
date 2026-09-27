import sharp from 'sharp';
import { createSupabaseServerClient } from './server';
import { MEDIA_BUCKET } from './media';

export async function saveGeneratedImageToSupabase(
  base64: string,
  userId: string,
  generationId: string,
  aspectRatio: 'landscape-16-9' | 'portrait-9-16'
): Promise<string> {
  const raw = Buffer.from(String(base64 || '').trim(), 'base64');
  if (!raw.length) throw new Error('Generated image payload is empty');

  const target = aspectRatio === 'portrait-9-16'
    ? { width: 864, height: 1536 }
    : { width: 1536, height: 864 };

  const normalized = await sharp(raw, { failOn: 'none' })
    .resize(target.width, target.height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const storagePath = `${userId}/generated/${generationId}.png`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, normalized, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw new Error(`Generated image upload failed: ${error.message}`);
  return storagePath;
}
