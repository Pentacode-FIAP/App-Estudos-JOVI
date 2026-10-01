/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Só lógica pura é testada; nenhum teste precisa de DOM.
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
