import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';

export const subscriptionInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 402 && err.error?.code === 'SUBSCRIPTION_REQUIRED') {
        toast.show('Tu suscripción ha vencido.', {
          actionLabel: 'Renovar',
          actionFn:    () => router.navigate(['/dashboard/suscripcion']),
          duration:    8000,
        });
      }
      return throwError(() => err);
    }),
  );
};
