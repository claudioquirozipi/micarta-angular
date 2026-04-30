import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const ADMIN_EMAIL = 'claudioquirozipi@gmail.com';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.user();
  if (!user)                    return router.createUrlTree(['/login']);
  if (user.email !== ADMIN_EMAIL) return router.createUrlTree(['/dashboard']);
  return true;
};
