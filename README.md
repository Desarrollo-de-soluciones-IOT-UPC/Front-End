# EMSafe — Portal web (Angular 21)

Portal de **administración** y **técnicos de campo** de EMSafe. Consume la API REST del
backend Spring Boot y recibe telemetría en vivo por STOMP/WebSocket.

> Arquitectura completa del sistema: [`../ARQUITECTURA-EMSAFE.md`](../ARQUITECTURA-EMSAFE.md)

## Estructura

```
src/app/
├── core/         http/api.client.ts · guards · interceptors · pipes
│                 services transversales (auth, language, theme, toast, layout…)
├── contexts/     ◄── espejo de los bounded contexts del backend
│   ├── iam/            domain/{user.model,role,user-status} · application/users.facade · infrastructure/users.api
│   ├── device/         domain/{device.model,device-status} · application/devices.facade · infrastructure/devices.api
│   ├── monitoring/     domain/{reading.model,radiation-level} · infrastructure/readings.socket
│   ├── alerting/       domain/alert.model · application/alarms.facade · infrastructure/alarms.api
│   ├── workorder/      domain/{work-order.model,work-order-status} · application/work-orders.facade · infrastructure/work-orders.api
│   ├── servicerecord/  domain/service-record.model · application/history.facade · infrastructure/history.api
│   └── reporting/      domain/{stats,chart,radiation-point}.model · application/dashboard.facade · infrastructure/dashboard.api
├── features/     las páginas (dashboard, devices, alarms, users, work-orders,
│                 history, map-radiation, profile, tech, auth) — SÓLO presentación
├── layouts/      admin-layout · tech-layout
└── shared/       componentes, layout (sidebar, topbar, toast)
```

**Reglas de dependencia**

- Las páginas de `features/` consumen **facades**, nunca HTTP. Los métodos de las facades
  son del negocio (`workOrdersFacade.cancel()`, `usersFacade.activate()`), no verbos de
  transporte.
- Sólo `core/http/api.client.ts` conoce `HttpClient` y la URL base.
- `core/` **no depende** de `contexts/`. Por eso `AuthService` (estado de sesión, lo usan
  el guard y el interceptor) vive en `core/services/` y no en `contexts/iam`.
- `contexts/monitoring/domain/radiation-level.ts` es la **misma regla de umbrales** que el
  backend, el edge y la app móvil. Nadie más clasifica niveles a mano.

## Desarrollo

```bash
npm ci
npx ng serve          # http://localhost:4200
```

La URL del backend sale de `src/environments/`. Para trabajar contra el stack local
completo (BD + backend + este front tras un proxy Caddy, todo en un puerto):

```bash
docker compose -f ../Back-End/deploy/docker-compose.local.yml up -d --build
# → http://localhost:8090
```

## Build

```bash
npx ng build          # artefactos en dist/emsafe-admin
```

Warnings esperados en un build limpio (ninguno es un error):

- presupuesto de `tech-work-order-detail.scss` excedido por ~3,4 kB
- `leaflet` y `@stomp/stompjs` no son ESM

## Verificación

No hay tests unitarios. La red de seguridad es:

1. `npx ng build` — compila **y** valida las plantillas contra los miembros de cada
   componente (AOT). Ahí se cazan la mayoría de las regresiones de un refactor.
2. Las 21 rutas que declaran las APIs de `contexts/*/infrastructure/` deben responder 200
   contra el backend levantado.
3. Los 15 flujos del portal, clicados a mano. Esto **no** lo cubre nada automático.

## Credenciales de desarrollo

| Email | Password | Portal |
|---|---|---|
| `admin@emsafe.com` | `admin123` | `/admin` |
| `marcus@emsafe.com` | `tech123` | `/tech` |
