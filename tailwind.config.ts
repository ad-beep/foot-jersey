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
        // Design-system semantic tokens
        primary:   '#111111',
        secondary: '#1A1A1A',
        elevated:  '#222222',
        accent: {
          DEFAULT: '#00C3D8',
          hover:   '#00E5FF',
        },
        cta: {
          DEFAULT: '#FF8C00',
          hover:   '#FF7A00',
        },
        border:  '#2A2A2A',
        success: '#00C853',
        error:   '#FF3D00',
        // Backward-compat brand shades
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
      fontFamily: {
        sans:        ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        montserrat:  ['var(--font-montserrat)', 'sans-serif'],
        heebo:       ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        // aliases kept for backward compat
        hebrew:      ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        display:     ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        mono:        ['monospace'],
      },
      fontSize: {
        'display-lg': ['3rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem',{ lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['1.875rem',{ lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        card:   '12px',
        button: '8px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        medium: '0 4px 16px rgba(0,0,0,0.5)',
        glow:   '0 0 24px rgba(0,195,216,0.25)',
        'glow-cta': '0 0 24px rgba(255,140,0,0.3)',
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
      },
      maxWidth: {
        layout: '1200px',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
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
      },
    },
  },
  plugins: [],
};

export default config;
