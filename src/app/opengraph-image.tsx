import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'FootJersey — Premium Football Jerseys';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          backgroundColor: '#0A0A0B',
          padding: '64px 72px',
          position: 'relative',
          fontFamily: 'Georgia, serif',
          overflow: 'hidden',
        }}
      >
        {/* Gold radial glow — top right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,162,75,0.22) 0%, rgba(200,162,75,0.06) 45%, transparent 70%)',
          }}
        />

        {/* Subtle pitch panel — left half */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '480px',
            height: '630px',
            background: 'linear-gradient(135deg, #111113 0%, #0A0A0B 100%)',
            borderRight: '1px solid rgba(200,162,75,0.12)',
          }}
        />

        {/* Corner registration marks */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', width: '20px', height: '20px', borderTop: '1.5px solid rgba(200,162,75,0.5)', borderLeft: '1.5px solid rgba(200,162,75,0.5)' }} />
        <div style={{ position: 'absolute', top: '24px', right: '24px', width: '20px', height: '20px', borderTop: '1.5px solid rgba(200,162,75,0.5)', borderRight: '1.5px solid rgba(200,162,75,0.5)' }} />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '20px', height: '20px', borderBottom: '1.5px solid rgba(200,162,75,0.5)', borderLeft: '1.5px solid rgba(200,162,75,0.5)' }} />
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '20px', height: '20px', borderBottom: '1.5px solid rgba(200,162,75,0.5)', borderRight: '1.5px solid rgba(200,162,75,0.5)' }} />

        {/* Gold top hairline */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '45%',
            height: '2px',
            background: 'linear-gradient(to right, #C8A24B, transparent)',
          }}
        />

        {/* Monogram watermark */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '60px',
            fontSize: '320px',
            fontStyle: 'italic',
            color: 'rgba(200,162,75,0.05)',
            letterSpacing: '-0.06em',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          FJ
        </div>

        {/* Content — stacked above bottom */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0px' }}>

          {/* Kicker */}
          <div
            style={{
              fontSize: '13px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(200,162,75,0.75)',
              marginBottom: '20px',
              fontFamily: 'monospace',
            }}
          >
            EST. IL · SINCE 2023 · 18 COLLECTIONS
          </div>

          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px', marginBottom: '20px' }}>
            <span
              style={{
                fontSize: '90px',
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#ffffff',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Foot
            </span>
            <span
              style={{
                fontSize: '90px',
                fontWeight: 900,
                fontStyle: 'italic',
                color: '#C8A24B',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Jersey
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '26px',
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              marginBottom: '36px',
              maxWidth: '600px',
              lineHeight: 1.3,
            }}
          >
            Premium football jerseys from every league.
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {[
              'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'World Cup 2026', 'Retro Classics',
            ].map((label) => (
              <div
                key={label}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  border: '1px solid rgba(200,162,75,0.3)',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(200,162,75,0.7)',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              shopfootjersey.com
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(200,162,75,0.4)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              PayPal · BIT
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(200,162,75,0.4)' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              Ships all of Israel
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
