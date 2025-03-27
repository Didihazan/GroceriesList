/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      direction: ['rtl'],
      screens: {
        'nav-break': '900px',
      },
      fontFamily: {
        'heebo': ['"Amatic SC"','Heebo', 'sans-serif'],
      },
    }
  },
  plugins: [],
}