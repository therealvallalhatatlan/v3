import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeText(value: string | null, fallback: string, max = 110) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : fallback;
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  const eyebrow = safeText(searchParams.get('eyebrow'), 'V3 / VALÓSÁG MOTOR', 34);

  const titleParts = wrapText(title.toUpperCase(), 23);
  const subtitleParts = wrapText(subtitle, 42);

  const titleSvg = titleParts
    .map(
      (line, index) =>
        `<text x="92" y="${index === 0 ? 235 : 235 + index * 66}" class="title">${escapeXml(line)}</text>`,
    )
    .join('');

  const subtitleStart = 390 + Math.max(0, titleParts.length - 2) * 66;
  const subtitleSvg = subtitleParts
    .map(
      (line, index) =>
        `<text x="92" y="${subtitleStart + index * 34}" class="subtitle">${escapeXml(line)}</text>`,
    )
    .join('');

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#050505"/>
        <stop offset="58%" stop-color="#101012"/>
        <stop offset="100%" stop-color="#202024"/>
      </linearGradient>
      <radialGradient id="glow" cx="78%" cy="42%" r="34%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".15"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
        <path d="M22 0H0V22" fill="none" stroke="#ffffff" stroke-opacity=".045"/>
      </pattern>
      <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
      <style>
        .title { font: 800 60px Arial, Helvetica, sans-serif; letter-spacing: -2px; fill: #f2f2f2; }
        .subtitle { font: 400 25px Arial, Helvetica, sans-serif; fill: #c4c4c8; }
        .small { font: 700 17px Arial, Helvetica, sans-serif; letter-spacing: 4px; fill: #8d8d93; }
        .micro { font: 700 12px Arial, Helvetica, sans-serif; letter-spacing: 2px; fill: #55555a; }
      </style>
    </defs>

    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect width="1200" height="630" fill="url(#grid)" opacity=".45"/>

    <circle cx="1008" cy="248" r="198" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
    <circle cx="1008" cy="248" r="132" fill="#000000" fill-opacity=".28" stroke="#ffffff" stroke-opacity=".06"/>
    <ellipse cx="1005" cy="310" rx="175" ry="44" fill="#000000" fill-opacity=".45" filter="url(#shadow)"/>

    <rect x="55" y="50" width="1090" height="530" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".12"/>
    <path d="M72 142H330" stroke="#ffffff" stroke-opacity=".06"/>
    <path d="M870 520H1128" stroke="#ffffff" stroke-opacity=".06"/>

    <g transform="translate(842 86)">
      <path d="M72 132 C44 86 41 27 62 2 C76 -15 96 1 94 28 L88 102" fill="#dcdcdc"/>
      <path d="M180 132 C208 86 211 27 190 2 C176 -15 156 1 158 28 L164 102" fill="#dcdcdc"/>
      <ellipse cx="126" cy="184" rx="102" ry="116" fill="#e8e8e8"/>
      <path d="M65 78 C76 64 98 61 113 70" stroke="#bcbcc1" stroke-width="7" stroke-linecap="round" opacity=".55"/>
      <path d="M139 70 C154 61 176 64 187 78" stroke="#bcbcc1" stroke-width="7" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="90" cy="170" rx="22" ry="30" fill="#090909"/>
      <ellipse cx="162" cy="170" rx="22" ry="30" fill="#090909"/>
      <ellipse cx="126" cy="218" rx="17" ry="13" fill="#090909"/>
      <path d="M126 226 C114 244 101 248 89 241" stroke="#090909" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M126 226 C138 244 151 248 163 241" stroke="#090909" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M26 268 C58 298 85 310 126 314 C167 310 194 298 226 268 L214 392 H38 Z" fill="#111113"/>
      <path d="M38 310 Q126 342 214 310" fill="none" stroke="#59595e" stroke-width="3" opacity=".55"/>
    </g>

    <text x="92" y="125" class="small">${escapeXml(eyebrow)} <tspan fill="#414145">///</tspan> VALLALHATATLAN</text>
    ${titleSvg}
    ${subtitleSvg}

    <rect x="92" y="500" width="226" height="47" rx="9" fill="#f2f2f2"/>
    <text x="111" y="531" font="800 18px Arial, Helvetica, sans-serif" fill="#090909">6 INGYENES GENERÁLÁS</text>

    <rect x="333" y="500" width="330" height="47" rx="9" fill="none" stroke="#36363a"/>
    <text x="352" y="530" font="400 17px Arial, Helvetica, sans-serif" fill="#9d9da2">engine.vallalhatatlan.online</text>

    <text x="74" y="570" class="micro">CHARACTER • SCENE • STYLE • CAMERA</text>
    <text x="1038" y="570" class="micro">V3 // 001</text>

    <g opacity=".45">
      <path d="M54 76H180" stroke="#ffffff" stroke-opacity=".12"/>
      <path d="M1020 76H1146" stroke="#ffffff" stroke-opacity=".12"/>
      <path d="M54 554H180" stroke="#ffffff" stroke-opacity=".12"/>
      <path d="M1020 554H1146" stroke="#ffffff" stroke-opacity=".12"/>
    </g>
  </svg>`;

  const png = await sharp(Buffer.from(svg))
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
}
