/**
 * Producción: el frontend y el backend viven detrás del MISMO dominio
 * (Caddy sirve la SPA en `/` y hace proxy de `/api` y `/ws` hacia Spring Boot).
 *
 * Por eso las URLs son relativas: no hay CORS, no hay contenido mixto, y si
 * mañana cambias de dominio no hay que recompilar nada.
 */
export const environment = {
  production: true,

  apiUrl: '/api',

  // STOMP necesita una URL absoluta con esquema ws/wss, así que la derivamos
  // del origen actual: https -> wss, http -> ws.
  wsUrl:
    typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
      : '/ws',
};
