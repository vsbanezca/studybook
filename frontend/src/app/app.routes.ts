import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { adminGuard, miembroGuard } from './core/admin.guard';
import { authGuard, sinSesionGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'espacios' },
  {
    path: 'iniciar-sesion',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./cuenta/iniciar-sesion/iniciar-sesion.component').then((m) => m.IniciarSesionComponent),
  },
  {
    path: 'registrarse',
    canActivate: [sinSesionGuard],
    loadComponent: () => import('./cuenta/registrarse/registrarse.component').then((m) => m.RegistrarseComponent),
  },
  {
    path: 'espacios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./espacios/consultar-espacios/consultar-espacios.component').then((m) => m.ConsultarEspaciosComponent),
  },
  {
    path: 'espacios/nuevo',
    canActivate: [adminGuard],
    loadComponent: () => import('./espacios/crear-espacio/crear-espacio.component').then((m) => m.CrearEspacioComponent),
  },
  {
    path: 'mis-reservas',
    canActivate: [miembroGuard],
    loadComponent: () =>
      import('./reservas/consultar-mis-reservas/consultar-mis-reservas.component').then((m) => m.ConsultarMisReservasComponent),
  },
  // TODO: eliminar antes de entregar (galeria del sistema de diseno, solo desarrollo)
  ...(isDevMode()
    ? [{ path: 'diseno', loadComponent: () => import('./diseno/galeria.component').then((m) => m.GaleriaComponent) }]
    : []),
  { path: '**', redirectTo: 'espacios' },
];
