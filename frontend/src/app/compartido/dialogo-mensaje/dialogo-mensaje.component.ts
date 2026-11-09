import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MSG } from '../messages';
import { SbIconComponent } from '../ui/sb-icon/sb-icon.component';

export interface DatosDialogoMensaje {
  titulo: string;
  /** Lineas de detalle, por ejemplo una por campo con error. */
  detalle?: string[];
}

/**
 * Modal de error con boton Aceptar. No se cierra solo ni al hacer clic afuera:
 * solo con Aceptar. Se abre con Dialog.open(DialogoMensajeComponent, OPCIONES_DIALOGO_MENSAJE(datos)).
 */
@Component({
  selector: 'sb-dialogo-mensaje',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialogo-mensaje.component.html',
  styleUrl: './dialogo-mensaje.component.css',
})
export class DialogoMensajeComponent {
  private readonly ref = inject(DialogRef<void>);
  protected readonly datos = inject<DatosDialogoMensaje>(DIALOG_DATA);
  protected readonly aceptar = MSG.comunes.aceptar;

  protected cerrar(): void {
    this.ref.close();
  }
}

export const opcionesDialogoMensaje = (data: DatosDialogoMensaje) => ({
  data,
  role: 'alertdialog' as const,
  disableClose: true,
  hasBackdrop: true,
  panelClass: ['sb-modal-panel', 'sb-modal-mensaje'],
  backdropClass: 'sb-modal-fondo',
  maxWidth: 'calc(100vw - 32px)',
  width: '420px',
  ariaLabelledBy: 'sb-dialogo-titulo',
});
