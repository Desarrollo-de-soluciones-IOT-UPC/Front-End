import { defineConfig, devices } from '@playwright/test';

/**
 * E2E del portal web contra el stack local completo.
 *
 * Se ejecuta sobre `http://localhost:8090` — la SPA servida por Caddy con el backend
 * real detrás, NO contra `ng serve` con mocks. La gracia es probar lo que el usuario
 * ve de verdad: si el backend devuelve otra forma de JSON, aquí se nota.
 *
 *   docker compose -f ../Back-End/deploy/docker-compose.local.yml up -d
 *   npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,        // comparten backend y BD: en paralelo se pisan los datos
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8090',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
