/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slateDeep: '#0f172a',
        tealAccent: '#14b8a6',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(20, 184, 166, 0.18), 0 16px 45px rgba(15, 23, 42, 0.4)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.35s ease-out',
      },
    },
  },
  plugins: [],
}

