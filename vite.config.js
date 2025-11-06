import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // CORRECCIÓN CRUCIAL: Esto fuerza a Vite a usar rutas relativas 
  // (ej. './index.js') en lugar de rutas absolutas (ej. '/index.js').
  base: './', 
});