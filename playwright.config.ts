import { defineConfig, devices } from '@playwright/test';

const PORTA = 4321;
const BASE = `http://localhost:${PORTA}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  /* Roda contra o build, não contra o dev server: é o artefato que vai ao ar,
     e é onde `rascunho: true` some de verdade. */
  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
