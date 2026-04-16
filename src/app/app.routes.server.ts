import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',                // landing page → CSR (no necesita SEO dinámico)
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
    path: '**',              // resto de rutas → SSR
    renderMode: RenderMode.Server,
  },
];
