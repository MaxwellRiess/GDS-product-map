/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gds-blue': '#1d70b8',
        'gds-blue-dark': '#003078',
        'gds-dark': '#0b0c0c',
        'gds-green': '#00703c',
        'gds-green-light': '#cce2d8',
        'gds-orange': '#f47738',
        'gds-orange-light': '#fcd6c3',
        'gds-red': '#d4351c',
        'gds-red-light': '#f6d7d2',
        'gds-purple': '#4c2c92',
        'gds-purple-light': '#dbd5e9',
        'gds-teal': '#28a197',
        'gds-teal-light': '#bfe3e0',
        'gds-grey': '#505a5f',
        'gds-mid-grey': '#b1b4b6',
        'gds-light-grey': '#f3f2f1',
        'gds-yellow': '#ffdd00',
      },
    },
  },
  plugins: [],
}
