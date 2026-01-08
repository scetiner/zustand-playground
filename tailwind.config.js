/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#0d0d0f',
          800: '#131318',
          700: '#1a1a21',
          600: '#24242d',
          500: '#2e2e3a',
          400: '#3d3d4d',
          300: '#5c5c73',
          200: '#8585a3',
          100: '#b3b3cc',
        },
        cyber: {
          yellow: '#f0db4f',
          'yellow-dim': '#c9b73e',
          orange: '#ff9f43',
          red: '#ff6b6b',
          green: '#26de81',
          blue: '#4dabf7',
          purple: '#a78bfa',
          pink: '#f472b6',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'monospace'],
        display: ['Sora', 'DM Sans', 'system-ui', 'sans-serif'],
        body: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

