import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MSG } from '../../messages';
import { NombreIcono } from '../sb-icon/iconos';
import { SbIconComponent } from '../sb-icon/sb-icon.component';

export type TipoMensaje = 'exito' | 'error' | 'aviso' | 'info';

const ICONOS: Record<TipoMensaje, NombreIcono> = {
  exito: 'circle-check',
  error: 'circle-x',
  aviso: 'triangle-alert',
  info: 'info',
};

@Component({
  selector: 'sb-message',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="banner" [class]="'banner ' + tipo()" role="alert">
      <sb-icon class="icono" [nombre]="icono()" />
      <div class="cuerpo">
        <p class="texto">{{ texto() }}</p>
        @if (detalle()) {
          <p class="detalle">{{ detalle() }}</p>
        }
      </div>
      <button type="button" class="sb-btn sb-btn-secundario" (click)="aceptarClick()">{{ aceptar }}</button>
    </div>
  `,
  styles: `
    :host { display: block; }
    .banner {
      display: flex; align-items: center; gap: var(--sb-space-3); flex-wrap: wrap;
      padding: var(--sb-space-3) var(--sb-space-4); border-radius: var(--sb-radius-control);
    }
    .icono { font-size: 20px; }
    .cuerpo { flex: 1 1 200px; min-width: 0; }
    .texto { margin: 0; font-weight: 500; }
    .detalle { margin: var(--sb-space-1) 0 0; font-size: 12px; line-height: 16px; }
    .exito { background: var(--sb-success-bg); color: var(--sb-success-text); }
    .exito .icono { color: var(--sb-success); }
    .error { background: var(--sb-error-bg); color: var(--sb-error-text); }
    .error .icono { color: var(--sb-error); }
    .aviso { background: var(--sb-warn-bg); color: var(--sb-warn-text); }
    .info { background: var(--sb-info-bg); color: var(--sb-info-text); }
    .info .icono { color: var(--sb-info); }
    /* El boton hereda el color oscuro del tipo de mensaje para mantener el contraste */
    .banner .sb-btn { color: inherit; border-color: currentColor; }
    .banner .sb-btn:hover { background: var(--sb-surface); }
    @media (max-width: 767.98px) {
      .banner { border-radius: 0; }
    }
  `,
})
export class SbMessageComponent {
  private readonly doc = inject(DOCUMENT);

  readonly tipo = input.required<TipoMensaje>();
  readonly texto = input.required<string>();
  readonly detalle = input<string>();
  readonly aceptado = output<void>();

  protected readonly aceptar = MSG.comunes.aceptar;
  protected readonly icono = computed(() => ICONOS[this.tipo()]);

  protected aceptarClick(): void {
    const eraError = this.tipo() === 'error';
    this.aceptado.emit();
    if (eraError) {
      // Tras un error, el foco vuelve al primer campo con error.
      queueMicrotask(() =>
        this.doc.querySelector<HTMLElement>('[aria-invalid="true"], .ng-invalid.ng-touched')?.focus(),
      );
    }
  }
}
