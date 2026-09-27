import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeText(value: string | null, fallback: string, max = 110) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : fallback;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? current + ' ' + word : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function characterFileName(value: string | null) {
  const requested = String(value || 'malac.jpg').trim();
  const file = requested.replace(/^.*[\\/]/, '');
  return /^[a-zA-Z0-9._-]+$/.test(file) ? file : 'character.png';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = safeText(
    searchParams.get('title'),
    'VÁLLALHATATLAN // VALÓSÁG MOTOR',
    70,
  );
  const subtitle = safeText(
    searchParams.get('subtitle'),
    'Karakter be. Valóság ki.',
    140,
  );
  const eyebrow = safeText(
    searchParams.get('eyebrow'),
    'V3 / VALÓSÁG MOTOR',
    34,
  );

  const titleParts = wrapText(title.toUpperCase(), 23);
  const subtitleParts = wrapText(subtitle, 42);

  const titleStart = 225;
  const titleSvg = titleParts
    .map(
      (line, index) =>
        `<text x="92" y="${titleStart + index * 62}" class="title">${escapeXml(line)}</text>`,
    )
    .join('');

  const subtitleStart = titleStart + titleParts.length * 62 + 34;
  const subtitleSvg = subtitleParts
    .map(
      (line, index) =>
        `<text x="92" y="${subtitleStart + index * 32}" class="subtitle">${escapeXml(line)}</text>`,
    )
    .join('');

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#050505"/>
        <stop offset="55%" stop-color="#101012"/>
        <stop offset="100%" stop-color="#202024"/>
      </linearGradient>
      <radialGradient id="glow" cx="82%" cy="42%" r="34%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".16"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M22 0H0V22" fill="none" stroke="#ffffff" stroke-opacity=".045"/>
      </pattern>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <style>
        .title { font: 800 60px Arial, Helvetica, sans-serif; letter-spacing: -2px; fill: #f2f2f2; }
        .subtitle { font: 700 25px Arial, Helvetica, sans-serif; fill: #c4c4c8; }
        .small { font: 700 17px Arial, Helvetica, sans-serif; letter-spacing: 4px; fill: #8d8d93; }
        .micro { font: 700 12px Arial, Helvetica, sans-serif; letter-spacing: 2px; fill: #55555a; }
      </style>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect width="1200" height="630" fill="url(#grid)" opacity=".45"/>

    <ellipse cx="930" cy="500" rx="240" ry="44" fill="#000000" fill-opacity=".50" filter="url(#shadow)"/>
    <rect x="55" y="50" width="1090" height="530" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".12"/>

    <path d="M72 142H330" stroke="#ffffff" stroke-opacity=".06"/>
    <path d="M870 520H1128" stroke="#ffffff" stroke-opacity=".06"/>

    <rect x="748" y="92" width="344" height="416" rx="12" fill="#050505" stroke="#ffffff" stroke-opacity=".10"/>
    <rect x="758" y="102" width="324" height="396" rx="8" fill="#111113"/>

    <text x="92" y="125" class="small">${escapeXml(eyebrow)} <tspan fill="#414145">///</tspan> VALLALHATATLAN</text>
    ${titleSvg}
    ${subtitleSvg}

    <rect x="92" y="500" width="226" height="47" rx="9" fill="#f2f2f2"/>
    <text x="111" y="531" font="800 18px Arial, Helvetica, sans-serif" fill="#090909">6 INGYENES GENERÁLÁS</text>

    <rect x="333" y="500" width="330" height="47" rx="9" fill="none" stroke="#36363a"/>
    <text x="352" y="530" font="400 17px Arial, Helvetica, sans-serif" fill="#9d9da2">engine.vallalhatatlan.online</text>

    <text x="74" y="570" class="micro">CHARACTER • SCENE • STYLE • CAMERA</text>
    <text x="1038" y="570" class="micro">V3 // 001</text>
  </svg>`;

  const base = await sharp(Buffer.from(svg)).png().toBuffer();

  const file = characterFileName(searchParams.get('character'));
  const characterUrl = new URL(`/og/${file}`, request.url);

  try {
    const characterResponse = await fetch(characterUrl, {
      headers: { Accept: 'image/png,image/*;q=0.9' },
      cache: 'no-store',
    });

    if (!characterResponse.ok) throw new Error(`Character fetch failed: ${characterResponse.status}`);

    const characterBuffer = Buffer.from(await characterResponse.arrayBuffer());

    const character = await sharp(characterBuffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({
        width: 324,
        height: 396,
        fit: 'cover',
        position: 'attention',
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();

    const png = await sharp(base)
      .composite([
        {
          input: character,
            left: 758,
          top: 102,
          blend: 'over',
        },
      ])
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    return new Response(png, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(png.length),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': 'inline; filename="vallalhatatlan-engine-og.png"',
      },
    });
  } catch {
    return new Response(base, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(base.length),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Disposition': 'inline; filename="vallalhatatlan-engine-og.png"',
      },
    });
  }
}
