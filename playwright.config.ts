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
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
