/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          bg: '#161622',
          dark: '#161622',
          card: '#232334',
          cardLighter: '#2c2c40',
          surface: '#232334',
          lavender: '#8a8d9b',
          rose: '#8b5cf6',
          silver: '#a0a3bd',
          white: '#ffffff',
        },
        darkUI: {
          bg: '#161622',
          card: '#232334',
          cardHover: '#2a2a3e',
          pillBg: '#1c1c2a',
          purple: '#8b5cf6',
          indigo: '#6366f1',
          pink: '#ff85a1',
          cyan: '#38bdf8',
          orange: '#f97316',
          emerald: '#10b981',
          textMuted: '#8a8d9b',
          textLight: '#e2e4f0',
        },
        brand: {
          50: '#f8fafc',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#8a8d9b',
          400: '#a855f7',
          500: '#8b5cf6',
          600: '#6366f1',
          700: '#4f46e5',
          800: '#232334',
          900: '#1c1c2a',
          950: '#161622',
        },
        sidebar: {
          bg: '#161622',
          surface: '#232334',
          border: '#2a2a3e',
          text: '#8a8d9b',
          active: '#8b5cf6',
        }
      },
    },
  },
  plugins: [],
};
