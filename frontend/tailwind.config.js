/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        fest: {
          bg: '#100B08',
          surface: '#17110D',
          card: '#1C1410',
          raised: '#211811',
          orange: '#FF6A00',
          primary: '#FF7A1A',
          amber: '#FFB36B',
          light: '#FFD0A6',
          text: '#FFF7F0',
          secondary: '#C4B3A7',
          muted: '#948277',
          border: 'rgba(255, 179, 107, 0.16)',
          borderGlow: 'rgba(255, 122, 26, 0.45)',
          focus: '#FFC58A',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6A00',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          dark: '#100B08',
          card: '#1C1410',
          border: 'rgba(255, 179, 107, 0.16)',
        },
      },
      backgroundImage: {
        'fest-radial': 'radial-gradient(circle at 50% 0%, rgba(255, 106, 0, 0.15), transparent 70%)',
        'fest-glow': 'radial-gradient(circle at 50% 50%, rgba(255, 122, 26, 0.12), transparent 60%)',
      },
      boxShadow: {
        'orange-glow': '0 0 25px -5px rgba(255, 106, 0, 0.35)',
        'orange-glow-lg': '0 0 45px -8px rgba(255, 122, 26, 0.45)',
        'amber-subtle': '0 0 15px -3px rgba(255, 179, 107, 0.2)',
      },
    },
  },
  plugins: [],
}

