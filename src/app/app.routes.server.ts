import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'users/edit-client/:id',     renderMode: RenderMode.Client },
  { path: 'users/edit-admin/:id',      renderMode: RenderMode.Client },
  { path: 'users/edit-technician/:id', renderMode: RenderMode.Client },
  { path: '**',                        renderMode: RenderMode.Prerender },
];
