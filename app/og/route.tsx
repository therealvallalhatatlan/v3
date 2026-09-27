import { ImageResponse } from 'next/og';

export const runtime = 'edge';

function clean(value: string | null, fallback: string, max = 90) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = clean(searchParams.get('title'), 'VÁLLALHATATLAN ILLUSZTRÁCIÓS MOTOR', 70);
  const subtitle = clean(
    searchParams.get('subtitle'),
    'Karakteralapú képgenerálás. Saját karakterekből, saját jelenetekből.',
    120,
  );
  const eyebrow = clean(searchParams.get('eyebrow'), 'V3 / IMAGE GENERATOR', 32);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#09090a',
          color: '#f4f4f5',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 76% 46%, rgba(244,244,245,0.14), transparent 22%), linear-gradient(105deg, #050505 0%, #111113 54%, #202024 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.2,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '-120px',
            top: '70px',
            width: '640px',
            height: '640px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '-80px',
            top: '-40px',
            width: '520px',
            height: '760px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07), transparent 54%)',
            transform: 'rotate(8deg)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '56px',
            top: '48px',
            right: '56px',
            bottom: '44px',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '18px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '710px',
            padding: '70px 0 62px 92px',
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#a1a1aa',
              fontSize: '18px',
              letterSpacing: '5px',
              fontWeight: 700,
            }}
          >
            <span>{eyebrow}</span>
            <span style={{ color: '#52525b' }}>///</span>
            <span>VALLALHATATLAN.ONLINE</span>
          </div>

          <div
            style={{
              marginTop: '28px',
              fontSize: '68px',
              lineHeight: 0.98,
              letterSpacing: '-2px',
              fontWeight: 800,
              maxWidth: '680px',
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: '28px',
              color: '#c4c4c7',
              fontSize: '27px',
              lineHeight: 1.25,
              maxWidth: '610px',
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '42px',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '12px 18px',
                borderRadius: '10px',
                background: '#f4f4f5',
                color: '#09090a',
                fontSize: '20px',
                fontWeight: 800,
              }}
            >
              engine.vallalhatatlan.online
            </div>
            <div
              style={{
                display: 'flex',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#a1a1aa',
                fontSize: '18px',
              }}
            >
              6 FREE KREDIT
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: '112px',
            top: '82px',
            width: '360px',
            height: '470px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.52)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 0 90px rgba(255,255,255,0.08)',
            }}
          />

          <svg width="270" height="360" viewBox="0 0 270 360" style={{ position: 'relative' }}>
            <ellipse cx="135" cy="206" rx="96" ry="116" fill="#e8e8ea" />
            <ellipse cx="88" cy="74" rx="28" ry="91" fill="#dedee1" transform="rotate(-8 88 74)" />
            <ellipse cx="182" cy="74" rx="28" ry="91" fill="#dedee1" transform="rotate(8 182 74)" />
            <ellipse cx="91" cy="86" rx="12" ry="63" fill="#8c8c91" opacity="0.35" transform="rotate(-8 91 86)" />
            <ellipse cx="179" cy="86" rx="12" ry="63" fill="#8c8c91" opacity="0.35" transform="rotate(8 179 86)" />
            <ellipse cx="101" cy="190" rx="20" ry="28" fill="#09090a" />
            <ellipse cx="169" cy="190" rx="20" ry="28" fill="#09090a" />
            <ellipse cx="135" cy="232" rx="17" ry="13" fill="#09090a" />
            <path d="M135 240 C122 254 111 257 99 251" stroke="#09090a" stroke-width="6" fill="none" stroke-linecap="round" />
            <path d="M135 240 C148 254 159 257 171 251" stroke="#09090a" stroke-width="6" fill="none" stroke-linecap="round" />
            <path d="M44 283 C83 326 187 326 226 283 L207 350 L63 350 Z" fill="#111113" />
            <path d="M45 300 L225 300" stroke="#55555b" stroke-width="3" opacity="0.6" />
          </svg>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '74px',
            bottom: '58px',
            color: '#52525b',
            fontSize: '13px',
            letterSpacing: '2px',
            zIndex: 4,
          }}
        >
          CHARACTER • SCENE • STYLE • CAMERA
        </div>

        <div
          style={{
            position: 'absolute',
            right: '74px',
            bottom: '58px',
            color: '#52525b',
            fontSize: '13px',
            letterSpacing: '2px',
            zIndex: 4,
          }}
        >
          001 // V3
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
