import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SesionService } from './sesion.service';

/** Envia la cookie de sesion y, si el servidor dice que la sesion ya no vale, vuelve al login. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  const sesion = inject(SesionService);
  const router = inject(Router);
  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      const esLogin = req.url === '/api/auth/login' || req.url === '/api/auth/sesion';
      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        sesion.limpiar();
        router.navigateByUrl('/iniciar-sesion');
      }
      return throwError(() => error);
    }),
  );
};
