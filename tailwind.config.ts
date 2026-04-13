import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── New "Dark Luxury Editorial" tokens ───────────────────────────
        ink:   '#0A0A0B',
        steel: '#141416',
        pitch: {
          DEFAULT: '#0F3D2E',
          light:   '#1A5C44',
          glow:    'rgba(15,61,46,0.35)',
        },
        gold: {
          DEFAULT: '#C8A24B',
          light:   '#D9B870',
        },
        chalk: {
          DEFAULT: '#F4F1EA',
          dark:    '#E8E4D9',
        },
        flare: {
          DEFAULT: '#FF4D2E',
          hover:   '#E63D20',
          glow:    'rgba(255,77,46,0.25)',
        },
        muted: '#6B6B6F',

        // ── Legacy aliases (keep existing components working) ─────────────
        primary:   '#0A0A0B',
        secondary: '#141416',
        elevated:  '#1C1C1F',
        accent: {
          DEFAULT: '#0F3D2E',
          hover:   '#1A5C44',
        },
        cta: {
          DEFAULT: '#FF4D2E',
          hover:   '#E63D20',
        },
        border:  '#1E1E21',
        success: '#00C853',
        error:   '#FF3D00',

        // ── Legacy brand shades (kept for any usage in admin) ─────────────
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        // ── Primary editorial fonts ───────────────────────────────────────
        sans:        ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
        display:     ['var(--font-playfair)', 'Georgia', 'serif'],
        playfair:    ['var(--font-playfair)', 'Georgia', 'serif'],
        mono:        ['var(--font-jetbrains)', 'monospace'],
        jetbrains:   ['var(--font-jetbrains)', 'monospace'],

        // ── Hebrew ────────────────────────────────────────────────────────
        heebo:       ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        hebrew:      ['var(--font-heebo)', 'system-ui', 'sans-serif'],

        // ── Backward-compat alias ─────────────────────────────────────────
        montserrat:  ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial display scale
        'display-2xl': ['clamp(3.5rem, 10vw, 8rem)',   { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl':  ['clamp(2.5rem, 7vw, 5.5rem)',  { lineHeight: '1.0',  letterSpacing: '-0.03em' }],
        'display-lg':  ['clamp(2rem, 5vw, 3.5rem)',    { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md':  ['clamp(1.5rem, 4vw, 2.5rem)',  { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
        'display-sm':  ['clamp(1.25rem, 3vw, 1.875rem)',{ lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // Utility
        'kicker':      ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em' }],
      },
      borderRadius: {
        card:   '12px',
        button: '8px',
        xl2:    '20px',
      },
      boxShadow: {
        subtle:      '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.7)',
        medium:      '0 4px 16px rgba(0,0,0,0.6)',
        large:       '0 8px 32px rgba(0,0,0,0.7)',
        'glow-pitch': '0 0 24px rgba(15,61,46,0.4)',
        'glow-gold':  '0 0 24px rgba(200,162,75,0.3)',
        'glow-flare': '0 0 24px rgba(255,77,46,0.35)',
        // Legacy aliases
        glow:        '0 0 24px rgba(15,61,46,0.3)',
        'glow-cta':  '0 0 24px rgba(255,77,46,0.3)',
      },
      screens: {
        xs:  '420px',
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        layout: '1200px',
        prose:  '72ch',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'word-reveal':   'wordReveal 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'ticker-scroll': 'tickerScroll 25s linear infinite',
        'star-pop':      'starPop 0.4s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wordReveal: {
          from: { clipPath: 'inset(0 0 100% 0)', transform: 'translateY(12px)', opacity: '0' },
          to:   { clipPath: 'inset(0 0 0% 0)',   transform: 'translateY(0)',    opacity: '1' },
        },
        tickerScroll: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        starPop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
