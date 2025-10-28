import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare'; 
import tailwind from "@astrojs/tailwind"; // Incluye Tailwind

export default defineConfig({
  // Integraciones: React y Tailwind CSS
  integrations: [react(), tailwind({ config: {} })],
  
  // Configuración de salida para el despliegue Edge/Serverless en Cloudflare
  output: 'server', 
  adapter: cloudflare(), 
  
  // Directorio de salida por defecto
  outDir: './dist', 
});
