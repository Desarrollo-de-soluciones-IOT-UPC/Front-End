import { Page, expect } from '@playwright/test';

export const ADMIN = { email: 'admin@emsafe.com', password: 'admin123' };
export const TECH = { email: 'marcus@emsafe.com', password: 'tech123' };

/** Entra por el formulario real y espera a aterrizar en el portal. */
export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('.btn-signin').click();
  await page.waitForURL(/\/(admin|tech)/, { timeout: 15_000 });
}

/**
 * Recoge los errores de consola y las excepciones no capturadas de la página.
 *
 * <p>Esto es lo que más falta hacía. `ApiClient` devuelve un valor por defecto cuando
 * una llamada falla, así que una pantalla rota puede verse simplemente <b>vacía</b>:
 * sin mirar la consola no se distingue "no hay datos" de "la llamada reventó".
 */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED.some((re) => re.test(text))) return;
    errors.push(`console: ${text}`);
  });

  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  return errors;
}

/**
 * Ruido conocido que no indica un fallo de la aplicación:
 * - los tiles de OpenStreetMap fallan sin red externa (el mapa de Leaflet)
 * - favicon ausente
 * - el WebSocket no conecta si el navegador headless bloquea ws://
 */
const IGNORED = [
  /tile\.openstreetmap/i,
  /favicon/i,
  /Failed to load resource.*\b(404|403)\b.*favicon/i,
  /WebSocket/i,
  /net::ERR_INTERNET_DISCONNECTED/i,
];

/** Falla el test si la página registró errores, mostrándolos todos. */
export function expectNoErrors(errors: string[]) {
  expect(errors, `errores en consola:\n  ${errors.join('\n  ')}`).toEqual([]);
}

/** Un sufijo único para no chocar con datos de corridas anteriores. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}
