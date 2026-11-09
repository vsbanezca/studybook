import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/** Las rutas de administracion exigen rol Administrador. El servidor vuelve a validarlo (403). */
export const adminGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (!sesion.autenticado()) {
    return router.parseUrl('/iniciar-sesion');
  }
  return sesion.esAdmin() ? true : router.parseUrl('/espacios');
};

/** Mis reservas es solo del rol Miembro. El Administrador vuelve a Espacios. */
export const miembroGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (!sesion.autenticado()) {
    return router.parseUrl('/iniciar-sesion');
  }
  return sesion.esAdmin() ? router.parseUrl('/espacios') : true;
};
