/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6', // Purple
        secondary: '#EC4899', // Pink
        background: '#F3E8FF', // Light purple
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
