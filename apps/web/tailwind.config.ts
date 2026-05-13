import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        buta: {
          50:  '#fff4ec',
          100: '#ffe4d0',
          200: '#ffc59a',
          300: '#ff9d5c',
          400: '#ff6f1a',
          500: '#ee5006',
          600: '#cf3a04',
          700: '#a52a09',
          800: '#85240e',
          900: '#6c1f0e',
          950: '#3a0e04',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
        'slide-up': 'slide-up 350ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
