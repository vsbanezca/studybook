import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, TemplateRef, effect, inject, input, model, output, untracked, viewChild,
} from '@angular/core';
import { MSG } from '../../messages';

export interface DatoConfirmacion {
  etiqueta: string;
  valor: string;
}

let siguienteId = 0;

/**
 * Modal de confirmacion sobre @angular/cdk/dialog.
 * El CDK aporta foco atrapado, Esc, clic afuera y devolver el foco a quien lo abrio.
 * El aspecto sale de las clases globales .sb-modal-panel y .sb-modal-fondo (styles/base.css).
 */
@Component({
  selector: 'sb-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #plantilla>
      <h2 class="titulo" [id]="tituloId">{{ titulo() }}</h2>
      <dl class="datos">
        @for (d of datos(); track d.etiqueta) {
          <div class="dato">
            <dt class="sb-apoyo">{{ d.etiqueta }}</dt>
            <dd>{{ d.valor }}</dd>
          </div>
        }
      </dl>
      <div class="acciones">
        <button type="button" class="sb-btn sb-btn-secundario" (click)="rechazar()">{{ no }}</button>
        <button type="button" class="sb-btn sb-btn-primario" (click)="confirmar()">{{ si }}</button>
      </div>
    </ng-template>
  `,
  styles: `
    .titulo { margin: 0 0 var(--sb-space-4); font-size: 20px; line-height: 28px; font-weight: 500; }
    .datos { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sb-space-4); margin: 0 0 var(--sb-space-6); }
    .dato { min-width: 0; }
    dt { margin: 0; }
    dd { margin: var(--sb-space-1) 0 0; font-weight: 500; overflow-wrap: anywhere; }
    .acciones { display: flex; justify-content: flex-end; gap: var(--sb-space-2); }
    @media (max-width: 767.98px) {
      .acciones .sb-btn { flex: 1; padding-inline: var(--sb-space-2); }
    }
  `,
})
export class SbConfirmDialogComponent {
  private readonly dialog = inject(Dialog);
  private readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantilla');
  private ref: DialogRef<unknown> | null = null;
  private decidido = false;

  readonly abierto = model(false);
  readonly titulo = input.required<string>();
  readonly datos = input<DatoConfirmacion[]>([]);
  readonly confirmado = output<void>();
  readonly rechazado = output<void>();

  protected readonly tituloId = `sb-modal-titulo-${siguienteId++}`;
  protected readonly si = MSG.comunes.si;
  protected readonly no = MSG.comunes.no;

  constructor() {
    effect(() => {
      const abrir = this.abierto();
      untracked(() => {
        if (abrir && !this.ref) {
          this.abrir();
        } else if (!abrir && this.ref) {
          this.ref.close();
        }
      });
    });
  }

  private abrir(): void {
    this.decidido = false;
    const ref = this.dialog.open(this.plantilla(), {
      role: 'dialog',
      ariaModal: true,
      ariaLabelledBy: this.tituloId,
      hasBackdrop: true,
      backdropClass: 'sb-modal-fondo',
      panelClass: 'sb-modal-panel',
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      closeOnNavigation: true,
    });
    this.ref = ref;
    ref.closed.subscribe(() => {
      this.ref = null;
      this.abierto.set(false);
      // Esc, clic afuera y «No» equivalen a rechazar.
      if (!this.decidido) {
        this.rechazado.emit();
      }
    });
  }

  protected confirmar(): void {
    this.decidido = true;
    this.confirmado.emit();
    this.ref?.close();
  }

  protected rechazar(): void {
    this.ref?.close();
  }
}
