/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0a0a0a',
        gunmetal: '#25282C',
        gold: '#D4AF37', // change here if you switch gold
        ivory: '#F3F3F0',
        titanium: '#C9CDD1',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-in': 'fade-in .35s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
