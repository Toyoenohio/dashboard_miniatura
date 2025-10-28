/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Asegúrate de que Tailwind escanee todos los archivos relevantes (Astro, React, etc.)
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Usar la fuente Inter como se requiere en las directivas
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
