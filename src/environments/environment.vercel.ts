/**
 * Build para VERCEL (sustentaciones).
 *
 * A diferencia de `environment.prod.ts` (Oracle, mismo dominio → URLs relativas),
 * aquí el front vive en Vercel y el backend en OTRO dominio (el túnel ngrok que
 * corre en tu laptop). Por eso las URLs son ABSOLUTAS y apuntan al ngrok.
 *
 * ⚠️ Cambia este host por TU dominio estático de ngrok (el mismo que pones en
 *    APP_PUBLIC_URL del backend). Debe ir SIN barra final.
 */
export const environment = {
  production: true,

  apiUrl: 'https://tayna-durable-unsuperiorly.ngrok-free.dev/api',
  wsUrl: 'wss://tayna-durable-unsuperiorly.ngrok-free.dev/ws',
};
