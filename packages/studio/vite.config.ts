import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Resolve the workspace packages directly to their TS source (no build step).
const core = fileURLToPath(new URL('../core/src/index.ts', import.meta.url));
const std = fileURLToPath(new URL('../std/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modelflow/core': core,
      '@modelflow/std': std,
    },
  },
  server: { port: 5273 },
});
