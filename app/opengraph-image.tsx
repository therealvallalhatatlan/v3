import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Vállalhatatlan Illusztrációs Motor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: '#080808',
          color: '#f2f2f2',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 82% 42%, rgba(255,255,255,.15), transparent 24%), radial-gradient(circle at 18% 88%, rgba(255,255,255,.06), transparent 32%), linear-gradient(120deg, #050505 0%, #101010 58%, #1b1b1b 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.22,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '55px',
            top: '50px',
            right: '55px',
            bottom: '50px',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: '18px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '86px',
            top: '74px',
            width: '360px',
            height: '360px',
            borderRadius: '180px',
            border: '1px solid rgba(255,255,255,.10)',
            background: 'rgba(0,0,0,.22)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '154px',
            top: '140px',
            width: '225px',
            height: '290px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0px',
              left: '20px',
              width: '58px',
              height: '140px',
              borderRadius: '34px',
              background: '#dcdcdc',
              transform: 'rotate(-9deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '0px',
              right: '20px',
              width: '58px',
              height: '140px',
              borderRadius: '34px',
              background: '#dcdcdc',
              transform: 'rotate(9deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '80px',
              width: '190px',
              height: '210px',
              borderRadius: '95px',
              background: '#e7e7e7',
              boxShadow: '0 0 70px rgba(255,255,255,.08)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '142px',
              left: '45px',
              width: '36px',
              height: '54px',
              borderRadius: '22px',
              background: '#080808',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '142px',
              right: '45px',
              width: '36px',
              height: '54px',
              borderRadius: '22px',
              background: '#080808',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '205px',
              width: '26px',
              height: '20px',
              borderRadius: '50%',
              background: '#080808',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '220px',
              width: '72px',
              height: '38px',
              borderBottom: '4px solid #080808',
              borderRadius: '0 0 42px 42px',
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: '720px',
            height: '100%',
            paddingLeft: '92px',
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '4px',
              color: '#8d8d93',
            }}
          >
            <span>V3 / IMAGE GENERATOR</span>
            <span style={{ color: '#414145' }}>///</span>
            <span>VALLALHATATLAN</span>
          </div>

          <div
            style={{
              marginTop: '28px',
              fontSize: '62px',
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: '-2px',
            }}
          >
            VÁLLALHATATLAN
            <div style={{ color: '#9a9a9f' }}>ILLUSZTRÁCIÓS MOTOR</div>
          </div>

          <div
            style={{
              marginTop: '26px',
              width: '590px',
              fontSize: '25px',
              lineHeight: 1.25,
              color: '#c4c4c8',
            }}
          >
            Karakterekből jelenetek. Karakterhű képgenerálás analóg, noir és VHS hangulattal.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '38px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '12px 18px',
                borderRadius: '9px',
                background: '#f2f2f2',
                color: '#090909',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              6 INGYENES GENERÁLÁS
            </div>
            <div
              style={{
                display: 'flex',
                padding: '11px 16px',
                borderRadius: '9px',
                border: '1px solid #36363a',
                color: '#9d9da2',
                fontSize: '18px',
              }}
            >
              engine.vallalhatatlan.online
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '74px',
            bottom: '68px',
            fontSize: '12px',
            letterSpacing: '2px',
            color: '#55555a',
            zIndex: 3,
          }}
        >
          CHARACTER • SCENE • STYLE • CAMERA
        </div>

        <div
          style={{
            position: 'absolute',
            right: '74px',
            bottom: '68px',
            fontSize: '12px',
            letterSpacing: '2px',
            color: '#55555a',
            zIndex: 3,
          }}
        >
          001 // V3
        </div>
      </div>
    ),
    size,
  );
}
