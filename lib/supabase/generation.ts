import sharp from 'sharp';
import { createSupabaseServerClient } from './server';
import { MEDIA_BUCKET } from './media';

const DEFAULT_WATERMARK_LOGO_URL = 'https://www.vallalhatatlan.online/img/logo.png';

async function createWatermarkedImage(normalized: Buffer, target: { width: number; height: number }): Promise<Buffer> {
  const logoUrl = process.env.WATERMARK_LOGO_URL || DEFAULT_WATERMARK_LOGO_URL;

  try {
    const response = await fetch(logoUrl, {
      headers: { 'User-Agent': 'Vallalhatatlan-Illustration-Engine/1.0' },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
    const logoBytes = Buffer.from(await response.arrayBuffer());

    const maxWidth = Math.round(target.width * 0.13);
    const margin = Math.max(18, Math.round(target.width * 0.022));
    const logo = await sharp(logoBytes, { failOn: 'none' })
      .resize({ width: maxWidth, withoutEnlargement: true })
      .png()
      .toBuffer();

    const logoMeta = await sharp(logo).metadata();
    const logoWidth = logoMeta.width || maxWidth;
    const logoHeight = logoMeta.height || Math.round(maxWidth * 0.3);
    const x = Math.max(0, target.width - logoWidth - margin);
    const y = Math.max(0, target.height - logoHeight - margin);

    return sharp(normalized)
      .composite([{ input: logo, left: x, top: y, blend: 'over' }])
      .png()
      .toBuffer();
  } catch (error) {
    console.error('Watermark logo could not be loaded, using text fallback:', error);

    const fontSize = Math.max(18, Math.round(target.width * 0.019));
    const paddingX = Math.round(fontSize * 0.65);
    const paddingY = Math.round(fontSize * 0.35);
    const textWidth = Math.round(fontSize * 7.5);
    const textHeight = Math.round(fontSize * 1.8);
    const margin = Math.max(18, Math.round(target.width * 0.022));
    const fallback = Buffer.from([
      `<svg width="${textWidth}" height="${textHeight}" xmlns="http://www.w3.org/2000/svg">` ,
      `<rect x="0" y="0" width="100%" height="100%" rx="${Math.round(fontSize * 0.35)}" fill="#000" fill-opacity="0.42"/>`,
      `<text x="${paddingX}" y="${fontSize + paddingY * 0.25}" fill="#fff" fill-opacity="0.88" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700">VÁLLALHATATLAN</text>`,
      `</svg>`,
    ].join(''));

    return sharp(normalized)
      .composite([{
        input: fallback,
        left: Math.max(0, target.width - textWidth - margin),
        top: Math.max(0, target.height - textHeight - margin),
        blend: 'over',
      }])
      .png()
      .toBuffer();
  }
}

export async function saveGeneratedImageToSupabase(
  base64: string,
  userId: string,
  generationId: string,
  aspectRatio: 'landscape-16-9' | 'portrait-9-16',
  addWatermark = false,
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

  const processed = addWatermark ? await createWatermarkedImage(normalized, target) : normalized;

  const storagePath = `${userId}/generated/${generationId}.png`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, processed, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw new Error(`Generated image upload failed: ${error.message}`);
  return storagePath;
}