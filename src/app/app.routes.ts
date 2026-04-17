import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shared/pages/home/home').then(m => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then(m => m.Register),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./auth/callback/callback').then(m => m.Callback),
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
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./restaurant/profile/restaurant-profile').then(m => m.RestaurantProfile),
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'ordenes',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'equipo',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'preview',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'qr',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
      {
        path: 'suscripcion',
        loadComponent: () =>
          import('./dashboard/home/dashboard-home').then(m => m.DashboardHome), // placeholder
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found').then(m => m.NotFound),
  },
];
