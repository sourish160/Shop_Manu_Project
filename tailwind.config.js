/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        editorial: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      backgroundColor: {
        white: '#E3FFFB',
        'slate-50': '#E3FFFB',
      },
      colors: {
        atelier: {
          bg: '#080808',
          dark: '#0E0E0E',
          card: '#131313',
          border: 'rgba(244, 242, 237, 0.1)',
          gold: '#C5A064',
          'gold-light': '#E2CA9D',
          'gold-dark': '#9A783E',
          cream: '#F4F2ED',
          wine: '#4A0D11',
          muted: 'rgba(244, 242, 237, 0.65)',
        },
      },
      letterSpacing: {
        widest: '0.2em',
        atelier: '0.3em',
      },
    },
  },
  plugins: [],
}
