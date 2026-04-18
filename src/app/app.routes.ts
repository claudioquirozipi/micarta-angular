import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/pages/home/home').then(m => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/pages/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/pages/register/register').then(m => m.Register),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/pages/callback/callback').then(m => m.Callback),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard-layout/dashboard-layout').then(m => m.DashboardLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/pages/home/dashboard-home').then(m => m.DashboardHome),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./restaurant/pages/profile/restaurant-profile').then(m => m.RestaurantProfile),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./dashboard/pages/menu/dashboard-menu').then(m => m.DashboardMenu),
      },
      {
        path: 'ordenes',
        loadComponent: () =>
          import('./dashboard/pages/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'equipo',
        loadComponent: () =>
          import('./restaurant/pages/members/restaurant-members').then(m => m.RestaurantMembers),
      },
      {
        path: 'preview',
        loadComponent: () =>
          import('./dashboard/pages/preview/dashboard-preview').then(m => m.DashboardPreview),
      },
      {
        path: 'qr',
        loadComponent: () =>
          import('./dashboard/pages/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'suscripcion',
        loadComponent: () =>
          import('./dashboard/pages/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
    ],
  },
  {
    path: 'r/:slug',
    loadComponent: () =>
      import('./public/pages/restaurant-menu/restaurant-menu').then(m => m.RestaurantMenu),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found').then(m => m.NotFound),
  },
];
