/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        text: 'var(--text)',
        subtext: 'var(--subtext)',
        border: 'var(--border)',
        'icon-bg': 'var(--icon-bg)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      animation: {
        'orb': 'orb-float 20s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}