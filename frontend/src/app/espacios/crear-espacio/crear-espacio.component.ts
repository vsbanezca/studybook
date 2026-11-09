import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { Espacio } from '../espacio.model';
import { EspacioService } from '../espacio.service';

interface ErrorCampo {
  campo: string;
  etiqueta: string;
  texto: string;
}

@Component({
  selector: 'app-crear-espacio',
  imports: [FormsModule, RouterLink, SbConfirmDialogComponent, SbIconComponent, SbMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-espacio.component.html',
  styleUrls: ['./crear-espacio.component.css']
})

export class CrearEspacioComponent {
  nuevoEspacio: Espacio = {
    nombre: '',
    ubicacion: '',
    piso: '',
    descripcion: '',
    capacidad: 1
  };

  mostrarModalConfirmacion = signal(false);
  mostrarMensajeExito = signal(false);
  intentado = signal(false);
  enviando = signal(false);
  datosConfirmacion: DatoConfirmacion[] = [];
  textoExito: string = MSG.espacio.creado;
  textoConfirmar: string = MSG.espacio.confirmar;

  constructor(private espacioService: EspacioService, private router: Router, private dialog: Dialog) {}

  /** Campos con error, en el orden del formulario. */
  errores(): ErrorCampo[] {
    const e = this.nuevoEspacio;
    const obligatorio = MSG.comunes.campoObligatorio;
    const lista: ErrorCampo[] = [];
    if (!e.nombre?.trim()) lista.push({ campo: 'nombre', etiqueta: 'Nombre del espacio', texto: obligatorio });
    if (!e.ubicacion?.trim()) lista.push({ campo: 'ubicacion', etiqueta: 'Ubicación', texto: obligatorio });
    if (!e.piso?.trim()) lista.push({ campo: 'piso', etiqueta: 'Piso', texto: obligatorio });
    if (!Number.isInteger(e.capacidad) || e.capacidad < 1) {
      lista.push({ campo: 'capacidad', etiqueta: 'Capacidad', texto: MSG.espacio.capacidadInvalida });
    }
    return lista;
  }

  errorDe(campo: string): string {
    return this.intentado() ? (this.errores().find((x) => x.campo === campo)?.texto ?? '') : '';
  }

  solicitarConfirmacion(): void {
    this.intentado.set(true);
    const errores = this.errores();
    if (errores.length > 0) {
      const detalle = errores.map((x) => x.etiqueta + ': ' + x.texto);
      const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.datosInvalidos, detalle }));
      ref.closed.subscribe(() => document.getElementById(errores[0].campo)?.focus());
      return;
    }
    this.datosConfirmacion = [
      { etiqueta: 'Nombre', valor: this.nuevoEspacio.nombre.trim() },
      { etiqueta: 'Ubicación', valor: this.nuevoEspacio.ubicacion.trim() },
      { etiqueta: 'Piso', valor: this.nuevoEspacio.piso.trim() },
      { etiqueta: 'Capacidad', valor: this.nuevoEspacio.capacidad + ' personas' },
    ];
    this.mostrarModalConfirmacion.set(true);
  }

  cancelarConfirmacion(): void {
    // Si la respuesta es "No", se cierra el modal conservando los datos
    this.mostrarModalConfirmacion.set(false);
  }

  confirmarCreacion(): void {
    this.mostrarModalConfirmacion.set(false);
    this.enviando.set(true);
    const e = this.nuevoEspacio;
    const espacio: Espacio = {
      ...e,
      nombre: e.nombre.trim(),
      ubicacion: e.ubicacion.trim(),
      piso: e.piso.trim(),
      descripcion: e.descripcion?.trim()
    };
    this.espacioService.crearEspacio(espacio).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mostrarMensajeExito.set(true);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: this.textoDeError(error) }));
      }
    });
  }

  aceptarMensajeExito(): void {
    // Al presionar "Aceptar", se vuelve a la pantalla de consulta de espacios
    this.router.navigateByUrl('/espacios');
  }

  private textoDeError(error: unknown): string {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 403) return MSG.espacio.sinPermiso;
    if (estado === 400) return (error as HttpErrorResponse).error?.mensaje ?? MSG.comunes.datosInvalidos;
    return MSG.comunes.errorServidor;
  }
}
