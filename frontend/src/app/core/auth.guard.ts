import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/** Las rutas protegidas exigen sesion; si no hay, se va al login. */
export const authGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.autenticado() ? true : inject(Router).parseUrl('/iniciar-sesion');
};

/** El login no se muestra si ya hay sesion: se redirige a la pantalla principal. */
export const sinSesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  return sesion.autenticado() ? inject(Router).parseUrl('/espacios') : true;
};
