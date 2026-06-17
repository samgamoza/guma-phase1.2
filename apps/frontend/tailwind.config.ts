import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:    '#0F1117',
        indigo: {
          DEFAULT: '#6C63FF',
          light:   '#8B85FF',
          dim:     '#2A2660',
          muted:   '#EEEDFE',
        },
        mint:   '#3ECF8E',
        cream:  '#F8F7F2',
        'warm-gray': {
          50:  '#FAFAF8',
          100: '#F2F1EC',
          200: '#E5E3DA',
          300: '#CCC9BC',
          400: '#9C9889',
          500: '#6B6760',
          600: '#4A4740',
          700: '#302E28',
          800: '#1E1C17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(15,17,23,0.06), 0 4px 16px rgba(15,17,23,0.06)',
        glow:  '0 0 0 3px rgba(108,99,255,0.25)',
        'glow-mint': '0 0 0 3px rgba(62,207,142,0.25)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease both',
        'fade-in':    'fadeIn 0.4s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
