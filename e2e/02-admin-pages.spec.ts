import { test, expect } from '@playwright/test';
import { ADMIN, collectErrors, expectNoErrors, login } from './helpers';

/**
 * Recorre TODAS las páginas del portal de administración.
 *
 * <p>Es la red que faltaba tras la fase 10: 17 páginas se recablearon de `DataService`
 * a facades y nadie las había abierto. `ng build` valida tipos y plantillas, pero no
 * que la página pinte con datos reales del backend.
 */
const PAGINAS = [
  { ruta: '/admin',               nombre: 'Dashboard' },
  { ruta: '/admin/work-orders',   nombre: 'Órdenes de trabajo' },
  { ruta: '/admin/history',       nombre: 'Historial' },
  { ruta: '/admin/users',         nombre: 'Usuarios' },
  { ruta: '/admin/devices',       nombre: 'Dispositivos' },
  { ruta: '/admin/alarms',        nombre: 'Alarmas' },
  { ruta: '/admin/map-radiation', nombre: 'Mapa de radiación' },
  { ruta: '/admin/profile',       nombre: 'Perfil' },
];

test.describe('Portal de administración', () => {

  for (const { ruta, nombre } of PAGINAS) {
    test(`${nombre} (${ruta}) carga sin errores`, async ({ page }) => {
      const errors = collectErrors(page);
      await login(page, ADMIN);

      await page.goto(ruta);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(new RegExp(ruta.replace('/', '\\/')));
      // El layout tiene que haberse montado: si el componente revienta, no hay nada.
      await expect(page.locator('main, .content, router-outlet + *').first()).toBeVisible();
      expectNoErrors(errors);
    });
  }

  test('los formularios de alta se abren', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);

    for (const ruta of ['/admin/work-orders/new', '/admin/users/new-admin', '/admin/users/new-technician']) {
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('input, select').first()).toBeVisible();
    }

    expectNoErrors(errors);
  });
});
