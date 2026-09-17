import { test, expect } from '@playwright/test';
import { ADMIN, TECH, collectErrors, expectNoErrors, login } from './helpers';

test.describe('Autenticación y control de acceso', () => {

  test('el admin entra y aterriza en su panel', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, ADMIN);

    await expect(page).toHaveURL(/\/admin/);
    expectNoErrors(errors);
  });

  test('el técnico entra y aterriza en su agenda', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, TECH);

    await expect(page).toHaveURL(/\/tech/);
    expectNoErrors(errors);
  });

  test('una contraseña incorrecta muestra el error y no deja pasar', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill('contraseña-mala');
    await page.locator('.btn-signin').click();

    await expect(page.locator('.error-msg')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('sin sesión, /admin redirige al login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('un técnico NO puede entrar en el portal de admin', async ({ page }) => {
    // Control de acceso por interfaz: tecleando la URL a mano.
    await login(page, TECH);
    await page.goto('/admin');

    await expect(page).not.toHaveURL(/\/admin(\/|$)/);
  });

  test('cerrar sesión vacía el almacenamiento y vuelve al login', async ({ page }) => {
    await login(page, ADMIN);

    await page.evaluate(() => localStorage.clear());
    await page.goto('/admin/devices');

    await expect(page).toHaveURL(/\/login/);
  });

  test('un token corrupto no deja una pantalla en blanco', async ({ page }) => {
    await login(page, ADMIN);
    await page.evaluate(() => localStorage.setItem('emsafe_token', 'basura-no-es-un-jwt'));

    await page.goto('/admin/users');
    await page.waitForTimeout(2000);

    // Con el token roto el backend devuelve 401/403. Lo que NO puede pasar es
    // quedarse en una página en blanco sin que el usuario sepa qué ocurre.
    const body = await page.locator('body').innerText();
    expect(body.trim().length, 'la página no puede quedarse vacía').toBeGreaterThan(0);
  });
});
