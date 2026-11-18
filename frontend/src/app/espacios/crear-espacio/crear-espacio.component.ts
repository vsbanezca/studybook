import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbCampoDirective, SbFieldErrorComponent } from '../../compartido/ui/sb-field-error/sb-field-error.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { Mensajes, listarErrores, textoDeCodigo } from '../../compartido/validacion/validation-messages';
import { enteroMinimo, marcarErrorServidor, obligatorio } from '../../compartido/validacion/validators';
import { Espacio } from '../espacio.model';
import { EspacioService } from '../espacio.service';

type Campo = 'nombre' | 'ubicacion' | 'piso' | 'descripcion' | 'capacidad';

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre del espacio',
  ubicacion: 'Ubicación',
  piso: 'Piso',
  descripcion: 'Descripción',
  capacidad: 'Capacidad',
};

const MENSAJES: Record<string, Mensajes> = {
  capacidad: { required: MSG.espacio.capacidadInvalida, entero: MSG.espacio.capacidadInvalida },
};

// SUPOSICION: el brief no define largos ni formato para estos campos; solo obligatorio y el tipo basico.
@Component({
  selector: 'app-crear-espacio',
  imports: [ReactiveFormsModule, RouterLink, SbCampoDirective, SbConfirmDialogComponent, SbFieldErrorComponent, SbMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-espacio.component.html',
  styleUrls: ['./crear-espacio.component.css']
})
export class CrearEspacioComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly espacioService = inject(EspacioService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  protected readonly form = this.fb.group({
    nombre: ['', obligatorio],
    ubicacion: ['', obligatorio],
    piso: ['', obligatorio],
    descripcion: [''],
    capacidad: this.fb.control<number | null>(1, [obligatorio, enteroMinimo()]),
  });
  protected readonly mensajes = MENSAJES;

  protected readonly mostrarModalConfirmacion = signal(false);
  protected readonly mostrarMensajeExito = signal(false);
  protected readonly enviando = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];
  protected readonly textoExito: string = MSG.espacio.creado;
  protected readonly textoConfirmar: string = MSG.espacio.confirmar;

  protected solicitarConfirmacion(): void {
    if (this.enviando() || this.mostrarModalConfirmacion()) return;
    this.form.markAllAsTouched();
    const errores = listarErrores(this.form, ETIQUETAS, MENSAJES);
    if (errores.length > 0) {
      const detalle = errores.map((x) => `${x.etiqueta}: ${x.texto}`);
      const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.datosInvalidos, detalle }));
      ref.closed.subscribe(() => document.getElementById(errores[0].campo)?.focus());
      return;
    }
    const v = this.form.getRawValue();
    this.datosConfirmacion = [
      { etiqueta: 'Nombre', valor: v.nombre.trim() },
      { etiqueta: 'Ubicación', valor: v.ubicacion.trim() },
      { etiqueta: 'Piso', valor: v.piso.trim() },
      { etiqueta: 'Capacidad', valor: v.capacidad + ' personas' },
    ];
    this.mostrarModalConfirmacion.set(true);
  }

  protected cancelarConfirmacion(): void {
    // Si la respuesta es "No", se cierra el modal conservando los datos
    this.mostrarModalConfirmacion.set(false);
  }

  protected confirmarCreacion(): void {
    this.mostrarModalConfirmacion.set(false);
    this.enviando.set(true);
    const v = this.form.getRawValue();
    const espacio: Espacio = {
      nombre: v.nombre.trim(),
      ubicacion: v.ubicacion.trim(),
      piso: v.piso.trim(),
      descripcion: v.descripcion.trim(),
      capacidad: Number(v.capacidad),
    };
    this.espacioService.crearEspacio(espacio).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mostrarMensajeExito.set(true);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.alFallar(error);
      }
    });
  }

  protected aceptarMensajeExito(): void {
    // Al presionar "Aceptar", se vuelve a la pantalla de consulta de espacios
    this.router.navigateByUrl('/espacios');
  }

  /** Modal con el texto del servidor y, si el error es de un campo, tambien marcado en ese campo. */
  private alFallar(error: unknown): void {
    const http = error instanceof HttpErrorResponse ? error : null;
    let titulo: string = MSG.comunes.errorServidor;
    let detalle: string[] | undefined;
    let primero: Campo | null = null;
    if (http?.status === 403) {
      titulo = MSG.espacio.sinPermiso;
    } else if (http?.status === 400) {
      titulo = http.error?.mensaje ?? MSG.comunes.datosInvalidos;
      const campos = (http.error?.campos ?? {}) as Record<string, string>;
      const lista: string[] = [];
      for (const [campo, valor] of Object.entries(campos)) {
        if (!(campo in this.form.controls)) continue;
        const texto = textoDeCodigo(campo, valor);
        marcarErrorServidor(this.form.controls[campo as Campo], texto);
        primero ??= campo as Campo;
        lista.push(`${ETIQUETAS[campo as Campo]}: ${texto}`);
      }
      detalle = titulo === MSG.comunes.datosInvalidos && lista.length > 0 ? lista : undefined;
    }
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
    ref.closed.subscribe(() => primero && document.getElementById(primero)?.focus());
  }
}
