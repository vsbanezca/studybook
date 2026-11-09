import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marcador minimo: la historia Consultar mis reservas aun no esta implementada. */
@Component({
  selector: 'sb-consultar-mis-reservas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="sb-contenedor pantalla"><h1 class="sb-titulo-pantalla">Mis reservas</h1></main>`,
  styles: `.pantalla { padding-block: var(--sb-space-8); }`,
})
export class ConsultarMisReservasComponent {}
