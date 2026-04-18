import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',                // landing page → CSR
    renderMode: RenderMode.Client,
  },
  {
    path: 'login',           // página estática → Prerender (SSG)
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'register',        // página estática → Prerender (SSG)
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'auth/callback',   // maneja token → solo cliente
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard',       // requiere auth → solo cliente
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard/**',    // subrutas del dashboard → solo cliente
    renderMode: RenderMode.Client,
  },
  {
    path: 'r/:slug',
    renderMode: RenderMode.Client,
  },
  {
    path: 'r/:slug/confirmar',
    renderMode: RenderMode.Client,
  },
  {
    path: 'r/:slug/mesero',
    renderMode: RenderMode.Client,
  },
  {
    path: 'r/:slug/cocina',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
