# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# EMSafe Admin (Angular) — build estático + Caddy
#
# Etapa 1: compila la SPA con Node.
# Etapa 2: Caddy con los archivos ya compilados dentro. Este mismo contenedor
#          es el que termina TLS y hace de reverse proxy hacia el backend,
#          así que es el único que expone puertos al exterior.
#
# Resultado: no hay proceso Node en producción. Antes hacía falta uno para el
# SSR; al ser un panel detrás de login, el SSR no aportaba SEO y sí consumía
# RAM y añadía una pieza más que podía caerse.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM caddy:2-alpine AS runtime

# La SPA compilada. El Caddyfile se monta desde deploy/ para poder ajustarlo
# sin reconstruir la imagen.
COPY --from=build /app/dist/emsafe-admin/browser /srv

EXPOSE 80 443
