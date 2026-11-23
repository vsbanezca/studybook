import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SesionService } from './sesion.service';

/** Rutas cuyo 401 no significa «la sesion vencio»: el propio inicio de sesion y la consulta al recargar. */
const SIN_REDIRECCION = [`${environment.apiUrl}/auth/login`, `${environment.apiUrl}/auth/sesion`];

/**
 * Si el servidor dice que la sesion ya no vale (401), limpia la sesion y vuelve al login.
 * La cookie de sesion la envia ApiService, que es el unico canal hacia el back.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const sesion = inject(SesionService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !SIN_REDIRECCION.includes(req.url)) {
        sesion.limpiar();
        router.navigateByUrl('/iniciar-sesion');
      }
      return throwError(() => error);
    }),
  );
};
