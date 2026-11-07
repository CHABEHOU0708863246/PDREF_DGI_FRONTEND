import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard/**', renderMode: RenderMode.Client },
  { path: 'dashboard/courriers/:id', renderMode: RenderMode.Client },
  { path: 'dashboard/courriers/:id/modifier', renderMode: RenderMode.Client },
  { path: 'dashboard/contribuables/:id', renderMode: RenderMode.Client },
  { path: 'dashboard/contribuables/:id/modifier', renderMode: RenderMode.Client },
  { path: 'dashboard/demandes/:id', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
