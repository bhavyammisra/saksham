import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Reuses the Vite config (aliases included). Unit tests live next to the code
// as *.test.ts; end-to-end tests in tests/e2e are run by Playwright instead.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}', 'content/**/*.test.ts', 'scripts/**/*.test.ts'],
    },
  }),
)
