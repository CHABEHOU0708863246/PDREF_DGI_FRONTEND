import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard/contribuables/:id', renderMode: RenderMode.Client },
  { path: 'dashboard/contribuables/:id/modifier', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
