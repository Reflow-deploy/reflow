/**
 * vite.config.js — Configuração do Vite (servidor de desenvolvimento e empacotador do site).
 *
 * Ativa o plugin do React e define a porta 3000. Usado por `npm run dev` e `npm run build`.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
