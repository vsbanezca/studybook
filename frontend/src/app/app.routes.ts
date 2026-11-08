import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
  // TODO: eliminar antes de entregar (galeria del sistema de diseno, solo desarrollo)
  ...(isDevMode()
    ? [{ path: 'diseno', loadComponent: () => import('./diseno/galeria.component').then((m) => m.GaleriaComponent) }]
    : []),
];
