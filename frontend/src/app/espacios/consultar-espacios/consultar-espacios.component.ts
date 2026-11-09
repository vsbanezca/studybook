import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marcador minimo: la historia Consultar espacios aun no esta implementada. */
@Component({
  selector: 'sb-consultar-espacios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="sb-contenedor pantalla"><h1 class="sb-titulo-pantalla">Consultar espacios</h1></main>`,
  styles: `.pantalla { padding-block: var(--sb-space-8); }`,
})
export class ConsultarEspaciosComponent {}
