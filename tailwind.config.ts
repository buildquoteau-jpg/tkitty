import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        member: {
          sage: '#7D9B76',
          'sage-light': '#EBF2EA',
          'dusty-blue': '#6B8CAE',
          'dusty-blue-light': '#E5EDF5',
          coral: '#D4856A',
          'coral-light': '#FAF0EC',
          sand: '#C4A882',
          'sand-light': '#F7F2EC',
          lavender: '#9B8BB4',
          'lavender-light': '#F2EFF7',
          terracotta: '#C17B5C',
          'terracotta-light': '#F9EDEA',
          blush: '#D4897A',
          'blush-light': '#FAECEA',
          slate: '#708090',
          'slate-light': '#EFF1F3',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'var(--font-inter)',
            color: '#1c1917',
            h1: { fontFamily: 'var(--font-playfair)' },
            h2: { fontFamily: 'var(--font-playfair)' },
            h3: { fontFamily: 'var(--font-playfair)' },
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
