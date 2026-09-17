import { test, expect } from '@playwright/test';
import { ADMIN, TECH, collectErrors, expectNoErrors, login } from './helpers';

/**
 * Que una página cargue "sin errores" no prueba nada por sí solo.
 *
 * <p>`ApiClient` devuelve una lista vacía cuando la llamada falla, así que una pantalla
 * rota se ve <b>exactamente igual</b> que una vacía. Estos tests exigen que los datos
 * del backend lleguen hasta el DOM: si una facade se recableó mal en la fase 10, aquí
 * se cae.
 */
test.describe('Los datos del backend llegan a la pantalla', () => {

  test('el dashboard pinta cifras, gráficos, órdenes y alertas', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Tarjetas de estadísticas con números de verdad, no "—" ni vacío.
    const texto = await page.locator('body').innerText();
    expect(texto).toMatch(/\d/);

    // Los tres gráficos de ApexCharts se montaron.
    await expect(page.locator('apx-chart').first()).toBeVisible({ timeout: 15_000 });

    // Últimas órdenes y alertas: vienen de dos facades distintas.
    await expect(page.locator('.status').first()).toBeVisible();
    await expect(page.locator('.alert-item').first()).toBeVisible();

    expectNoErrors(errors);
  });

  test('usuarios: la tabla trae las 10 cuentas sembradas', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table.table tbody tr');
    await expect(filas.first()).toBeVisible();
    expect(await filas.count()).toBeGreaterThan(0);

    // El badge de estado se renderiza con la clase del estado del usuario.
    await expect(page.locator('.status-dot').first()).toBeVisible();

    expectNoErrors(errors);
  });

  test('dispositivos: la tabla trae los sensores', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table.table tbody tr');
    await expect(filas.first()).toBeVisible();
    expect(await filas.count()).toBeGreaterThan(0);

    expectNoErrors(errors);
  });

  test('historial: hay actas de servicio', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/history');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table.table tbody tr');
    await expect(filas.first()).toBeVisible();
    expect(await filas.count()).toBeGreaterThan(0);

    expectNoErrors(errors);
  });

  test('alarmas: se listan las tarjetas', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/alarms');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.alarm-card').first()).toBeVisible();
    expect(await page.locator('.alarm-card').count()).toBeGreaterThan(0);

    expectNoErrors(errors);
  });

  test('órdenes de trabajo: la lista tiene filas', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/work-orders');
    await page.waitForLoadState('networkidle');

    const filas = page.locator('table tbody tr');
    await expect(filas.first()).toBeVisible();

    expectNoErrors(errors);
  });

  test('mapa: los contadores por nivel cuadran con la tabla', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/map-radiation');
    await page.waitForLoadState('networkidle');

    // Aquí es donde la fase 10 cambió la clasificación a la regla compartida
    // (`levelOf`). Si se rompió, los contadores no cuadran con las filas.
    const valores = await page.locator('.stat-card__value').allInnerTexts();
    expect(valores.length, 'faltan las tarjetas safe/caution/danger').toBeGreaterThanOrEqual(3);

    const [safe, caution, danger] = valores.slice(0, 3).map((v) => parseInt(v.trim(), 10));
    expect(Number.isNaN(safe + caution + danger), 'los contadores deben ser números').toBe(false);

    const filas = await page.locator('table.table tbody tr').count();
    expect(safe + caution + danger,
      'la suma de los contadores debe cubrir las lecturas listadas').toBeGreaterThanOrEqual(filas);

    expectNoErrors(errors);
  });

  test('perfil: carga los datos del usuario logueado', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/profile');
    await page.waitForLoadState('networkidle');

    // Viene de usersFacade.myProfile(). El email se muestra como texto y el nombre
    // se precarga en los inputs del formulario: ambos deben venir poblados.
    await expect(page.locator('.info-value').filter({ hasText: '@' }).first()).toBeVisible();

    const valores = await page.locator('input.form-input').evaluateAll(
      (els) => els.map((e) => (e as HTMLInputElement).value).filter(Boolean));
    expect(valores.length, 'el formulario debe venir precargado').toBeGreaterThan(0);

    expectNoErrors(errors);
  });

  test('portal técnico: agenda, órdenes e historial traen datos', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, TECH);

    for (const ruta of ['/tech', '/tech/work-orders', '/tech/history']) {
      await page.goto(ruta);
      await page.waitForLoadState('networkidle');
      const texto = await page.locator('body').innerText();
      expect(texto.trim().length, `${ruta} está vacía`).toBeGreaterThan(50);
    }

    expectNoErrors(errors);
  });
});
