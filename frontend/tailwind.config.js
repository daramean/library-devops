/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          500: '#3b5bdb',
          600: '#2f4ac7',
          700: '#2340b3',
          900: '#0f1f6b',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease',
        'slide-up':   'slideUp 0.4s ease',
        'skeleton':   'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },             to: { opacity: 1 } },
        slideUp:  { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        skeleton: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
    },
  },
  plugins: [],
};
