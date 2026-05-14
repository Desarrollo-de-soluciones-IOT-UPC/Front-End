import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'admin/users/edit-client/:id',     renderMode: RenderMode.Client },
  { path: 'admin/users/edit-admin/:id',      renderMode: RenderMode.Client },
  { path: 'admin/users/edit-technician/:id', renderMode: RenderMode.Client },
  { path: 'tech/work-orders/:id',            renderMode: RenderMode.Client },
  { path: '**',                              renderMode: RenderMode.Prerender },
];
