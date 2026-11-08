import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SbIconComponent } from '../sb-icon/sb-icon.component';
import { NombreIcono } from '../sb-icon/iconos';

export type EstadoReserva = 'Activa' | 'Cancelada';

@Component({
  selector: 'sb-status-chip',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="chip" [class.activa]="estado() === 'Activa'" [class.cancelada]="estado() === 'Cancelada'">
    <sb-icon [nombre]="icono()" />{{ estado() }}</span
  >`,
  styles: `
    :host { display: inline-block; }
    .chip {
      display: inline-flex; align-items: center; gap: var(--sb-space-1);
      padding: var(--sb-space-1) var(--sb-space-3); border-radius: var(--sb-radius-pill);
      font-size: 12px; line-height: 16px; font-weight: 500;
    }
    .chip sb-icon { font-size: 14px; }
    .activa { background: var(--sb-success-bg); color: var(--sb-success-text); }
    .cancelada { background: var(--sb-cancelled-bg); color: var(--sb-cancelled-text); }
  `,
})
export class SbStatusChipComponent {
  readonly estado = input.required<EstadoReserva>();
  protected readonly icono = computed<NombreIcono>(() => (this.estado() === 'Activa' ? 'check' : 'circle-x'));
}
