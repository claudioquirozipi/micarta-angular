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
    loadComponent: () => import('./shared/pages/home/home').then(m => m.Home), // placeholder
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found').then(m => m.NotFound),
  },
];
