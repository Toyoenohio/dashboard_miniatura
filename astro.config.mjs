import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Adapters y integraciones necesarias para este proyecto
  integrations: [react(), tailwind({
    // Configuración de Tailwind CSS
    applyBaseStyles: true
  })],
  // Adaptador para Cloudflare Pages
  adapter: cloudflare(),
  // Directorio de salida, por defecto 'dist'
  outDir: './dist'
});
