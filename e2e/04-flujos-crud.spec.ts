import { test, expect } from '@playwright/test';
import { ADMIN, collectErrors, expectNoErrors, login, unique } from './helpers';

/**
 * Los flujos que escriben. Cargar una lista sólo ejerce un GET; aquí se comprueba
 * que un POST/PUT/DELETE llega al backend y vuelve a la pantalla.
 *
 * <p>Cada test limpia lo que crea: la batería de shell (68/68) cuenta usuarios y
 * dispositivos sembrados, y dejar basura la haría fallar.
 */
test.describe('Flujos que escriben', () => {

  test('crear una alarma, verla en la lista y eliminarla', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/alarms');
    await page.waitForLoadState('networkidle');

    const titulo = unique('E2E Alarma');
    const antes = await page.locator('.alarm-card').count();

    await page.locator('.btn--primary').first().click();
    await expect(page.locator('.modal')).toBeVisible();

    await page.locator('.modal input.form-input').first().fill(titulo);
    await page.locator('.modal textarea.form-input').fill('Creada por la batería e2e');
    await page.locator('.modal .btn--primary').click();

    // La tarjeta nueva aparece sin recargar (la facade devuelve el objeto creado).
    await expect(page.locator('.alarm-card').filter({ hasText: titulo })).toBeVisible({ timeout: 10_000 });
    expect(await page.locator('.alarm-card').count()).toBe(antes + 1);

    // Y persiste de verdad: tras recargar sigue ahí.
    await page.reload();
    await page.waitForLoadState('networkidle');
    const creada = page.locator('.alarm-card').filter({ hasText: titulo });
    await expect(creada).toBeVisible();

    // Limpieza.
    page.once('dialog', (d) => d.accept());
    await creada.locator('.alarm-card__delete').click();
    await expect(page.locator('.alarm-card').filter({ hasText: titulo })).toHaveCount(0, { timeout: 10_000 });

    expectNoErrors(errors);
  });

  test('editar un dispositivo desde el menú de su fila', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');

    const primera = page.locator('table.table tbody tr').first();
    const nombreOriginal = (await primera.locator('td').first().innerText()).trim();

    await primera.locator('.menu-trigger').click();
    await page.locator('.dropdown-item').first().click();          // "Editar"

    // El modal debe venir PRECARGADO con los datos de esa fila: si el mapeo del
    // DTO se rompió al recablear a la facade, aparecería vacío.
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    const valor = await modal.locator('input.form-input').first().inputValue();
    expect(valor, 'el formulario de edición debe venir precargado').toContain(nombreOriginal.split(' ')[0]);

    await modal.locator('.btn--ghost').click();                    // cerrar sin guardar
    expectNoErrors(errors);
  });

  /**
   * 🐛 HALLAZGO — la página de Dispositivos no tiene botón de "Añadir".
   *
   * `openCreate()` está implementado entero en `devices.ts` (resetea el formulario y
   * abre el modal) y el modal sabe pintarse en modo alta ("Add device"), pero **nada
   * en `devices.html` invoca ese método**: no hay forma de crear un dispositivo desde
   * la interfaz.
   *
   * Es anterior al refactor DDD — viene del commit `691e81a "feat: update devices
   * section"`; la fase 10 sólo tocó el `.ts`. Se deja el test marcado como `fail`
   * para que quede registrado y **avise solo cuando se arregle**.
   */
  test.fail('la página de dispositivos debería permitir crear uno', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');

    const botonAlta = page.locator('button').filter({ hasText: /add|añadir|nuevo|new/i });
    await expect(botonAlta.first()).toBeVisible({ timeout: 3_000 });
  });

  test('el buscador de dispositivos filtra la tabla', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/devices');
    await page.waitForLoadState('networkidle');

    const total = await page.locator('table.table tbody tr').count();
    expect(total).toBeGreaterThan(0);

    await page.locator('input[placeholder]').first().fill('zzz-no-existe-nada-zzz');
    await page.waitForTimeout(800);

    const filtrado = await page.locator('table.table tbody tr').count();
    expect(filtrado, 'un término imposible debe vaciar la tabla').toBeLessThan(total);

    expectNoErrors(errors);
  });

  test('el historial filtra por estado', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/history');
    await page.waitForLoadState('networkidle');

    const total = await page.locator('table.table tbody tr').count();
    expect(total).toBeGreaterThan(0);

    const select = page.locator('select').first();
    if (await select.count()) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      // Filtrar no puede dejar más filas de las que había.
      expect(await page.locator('table.table tbody tr').count()).toBeLessThanOrEqual(total);
    }

    expectNoErrors(errors);
  });

  test('la exportación CSV del historial descarga un fichero', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/history');
    await page.waitForLoadState('networkidle');

    const descarga = page.waitForEvent('download', { timeout: 15_000 });
    await page.locator('.btn--ghost').first().click();
    const fichero = await descarga;

    expect(fichero.suggestedFilename()).toMatch(/\.csv$/i);
    expectNoErrors(errors);
  });

  test('el formulario de nueva orden carga clientes y técnicos', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/work-orders/new');
    await page.waitForLoadState('networkidle');

    // Los desplegables se llenan desde usersFacade.clients() y .technicians():
    // si una facade se recableó mal, vienen vacíos.
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThan(0);

    let conOpciones = 0;
    for (let i = 0; i < await selects.count(); i++) {
      if (await selects.nth(i).locator('option').count() > 1) conOpciones++;
    }
    expect(conOpciones, 'ningún desplegable trajo datos del backend').toBeGreaterThan(0);

    expectNoErrors(errors);
  });

  test('abrir el detalle de un acta del historial', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);
    await page.goto('/admin/history');
    await page.waitForLoadState('networkidle');

    // Usa workOrdersFacade.detail() — una facade distinta a la de la lista.
    await page.locator('table.table tbody tr').first().locator('button').last().click();
    await expect(page.locator('.modal, [role="dialog"]').first()).toBeVisible({ timeout: 10_000 });

    expectNoErrors(errors);
  });
});
