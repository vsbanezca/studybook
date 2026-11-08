import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NombreIcono } from '../sb-icon/iconos';
import { SbIconComponent } from '../sb-icon/sb-icon.component';

@Component({
  selector: 'sb-empty-state',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="vacio">
      <span class="circulo"><sb-icon [nombre]="icono()" /></span>
      <h2 class="titulo sb-titulo-seccion">{{ titulo() }}</h2>
      <p class="texto">{{ texto() }}</p>
      @if (accion()) {
        <button type="button" class="sb-btn sb-btn-primario" (click)="accionado.emit()">{{ accion() }}</button>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .vacio {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      gap: var(--sb-space-3); padding: var(--sb-space-12) var(--sb-space-4);
    }
    .circulo {
      display: inline-flex; align-items: center; justify-content: center;
      width: 64px; height: 64px; border-radius: var(--sb-radius-pill);
      background: var(--sb-primary-100); color: var(--sb-primary-700); font-size: 28px;
    }
    .titulo { font-size: 16px; line-height: 22px; }
    .texto { margin: 0; color: var(--sb-text-muted); }
  `,
})
export class SbEmptyStateComponent {
  /** Nombre de un icono de Lucide, por ejemplo 'calendar'. */
  readonly icono = input.required<NombreIcono>();
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  /** Verbo de la accion, por ejemplo 'Crear reserva'. */
  readonly accion = input<string>();
  readonly accionado = output<void>();
}
