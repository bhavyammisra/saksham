import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Path aliases: "@/x" is src/x, "@content/x" is content/x.
// Keep these in sync with "paths" in tsconfig.app.json.
const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@content': fileURLToPath(new URL('./content', import.meta.url)),
}

export default defineConfig({
  // Relative asset paths, so the built app works on any static host or sub-path.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias },
})
