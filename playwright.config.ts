import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against the production build served by `vite preview`,
// so they test what users actually get.
const PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Locally, at most 3 browsers at once: scenes animate continuously, and on a shared laptop
  // more parallel browsers starved the machine into timeouts (BUILD_PLAN P4 notes). CI keeps its default.
  workers: process.env.CI ? undefined : 3,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Every test starts as a returning player, who sees the short (1 s) splash, not the 4 s one.
    // splash.spec.ts clears this to test the first load (D-050).
    storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'saksham-splash', value: 'seen' }] }] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
