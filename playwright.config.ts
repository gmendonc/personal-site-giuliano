import { defineConfig, devices } from '@playwright/test';

const PORTA = 4321;

/**
 * Inclui o `base` do astro.config.ts. O `astro preview` só serve sob esse
 * subcaminho — bati nisso direto: `curl http://localhost:4321/` dá 404,
 * `curl http://localhost:4321/personal-site-giuliano/` dá 200.
 *
 * baseURL termina em barra, e todo `page.goto()` nos specs usa caminho
 * relativo SEM barra inicial (`goto('biblioteca')`, não `goto('/biblioteca')`)
 * — com barra inicial, a resolução de URL descarta o subcaminho do baseURL e
 * volta pra raiz do domínio, o mesmo bug que motivou esta mudança inteira.
 */
const BASE = `http://localhost:${PORTA}/personal-site-giuliano/`;

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
