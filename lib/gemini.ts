
function toImagePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid reference image data URL');
  }
  return {
    inline_data: {
      mime_type: match[1],
      data: match[2],
    },
  };
}

export type ImageAspectRatio = '16:9' | '9:16';

export async function generateImage(
  prompt: string,
  referenceImageDataUrls: string[] = [],
  aspectRatio: ImageAspectRatio = '16:9'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const selectedReferenceImages = referenceImageDataUrls.slice(0, 6);
  if (referenceImageDataUrls.length > selectedReferenceImages.length) {
    console.log(`Using ${selectedReferenceImages.length} of ${referenceImageDataUrls.length} reference images for Gemini`);
  }

  const requestParts = [
    { text: prompt },
    ...selectedReferenceImages.map(toImagePart),
  ];

  // Explicitly request the output ratio. The prompt contains framing guidance,
  // but the API must also be told which image geometry to actually render.
  const body = {
    contents: [
      {
        parts: requestParts,
      },
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio,
      },
    },
  };

  console.log('GEMINI REQUEST BODY:', JSON.stringify(body, null, 2));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Gemini API error:', res.status, text);
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  console.log('GEMINI RESPONSE BODY:', JSON.stringify(data, null, 2));
  if (data.error) {
    console.error('Gemini API error field:', JSON.stringify(data.error, null, 2));
  }
  if (data.warnings) {
    console.warn('Gemini API warnings:', JSON.stringify(data.warnings, null, 2));
  }
  const responseParts = [
    ...(data.candidates?.[0]?.content?.parts || []),
    ...(data.contents?.[0]?.parts || []),
  ];
  const imagePart = responseParts.find((part: any) => part?.inlineData?.data || part?.inline_data?.data);
  const base64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data || '';
  console.log('Gemini base64 length:', base64.length);
  console.log('Gemini base64 preview:', base64.slice(0, 100));
  if (!base64) {
    throw new Error('Gemini returned no image data');
  }
  return base64;
}
