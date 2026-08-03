/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fc',
          100: '#e0eff9',
          200: '#b9def3',
          300: '#7cc2ea',
          400: '#36a3dd',
          500: '#0082c8', // Bright Blue Accent
          600: '#005596', // Primary Blue Accent
          700: '#00467e',
          800: '#003c6a',
          900: '#063359',
          950: '#04203b',
        },
        clinical: {
          emerald: '#059669',
          amber: '#d97706',
          rose: '#e11d48',
          cyan: '#00a3e0',
          purple: '#7c3aed',
        }
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
