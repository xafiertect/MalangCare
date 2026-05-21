// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488', // Core Teal brand color
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#115e59',
        },
        slate: {
          950: '#0b0f19', // Sleek dark theme backdrop
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 30px rgb(0 0 0 / 0.12)',
        glass: 'inset 0 1px 1px 0 rgb(255 255 255 / 0.15)',
      }
    },
  },
  plugins: [],
}
