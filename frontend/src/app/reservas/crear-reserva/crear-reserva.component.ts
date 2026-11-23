import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { formatearFechaLarga } from '../../compartido/formato-fecha';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbCampoDirective, SbFieldErrorComponent } from '../../compartido/ui/sb-field-error/sb-field-error.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { SbSpaceCardComponent } from '../../compartido/ui/sb-space-card/sb-space-card.component';
import { Mensajes, listarErrores, textoDeCodigo, textoDeMensaje } from '../../compartido/validacion/validation-messages';
import {
  ahoraEnZona, dentroDeCapacidad, enteroMinimo, fechaNoPasada, horaFinPosterior, horaInicioNoPasada, marcarErrorServidor,
  obligatorio, revalidarAlCambiar,
} from '../../compartido/validacion/validators';
import { Espacio } from '../../espacios/espacio.model';
import { EspacioService } from '../../espacios/espacio.service';
import { SolicitudReserva } from '../reserva.model';
import { ReservaService } from '../reserva.service';

type Campo = 'espacioId' | 'fecha' | 'horaInicio' | 'horaFin' | 'asistentes';

const ETIQUETAS: Record<Campo, string> = {
  espacioId: 'Espacio',
  fecha: 'Fecha',
  horaInicio: 'Hora de inicio',
  horaFin: 'Hora de fin',
  asistentes: 'Asistentes',
};

const MENSAJES: Record<Campo, Mensajes> = {
  espacioId: { required: MSG.reserva.espacioObligatorio },
  fecha: {},
  horaInicio: {},
  horaFin: {},
  asistentes: { entero: MSG.reserva.asistentesInvalidos },
};

@Component({
  selector: 'app-crear-reserva',
  imports: [ReactiveFormsModule, RouterLink, SbCampoDirective, SbConfirmDialogComponent, SbFieldErrorComponent, SbMessageComponent, SbSpaceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-reserva.component.html',
  styleUrl: './crear-reserva.component.css',
})
export class CrearReservaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly espaciosApi = inject(EspacioService);
  private readonly reservasApi = inject(ReservaService);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cargado = signal(false);
  protected readonly seleccionado = signal<Espacio | null>(null);

  /** `espacioId` guarda el espacio elegido (no solo el id) para que la capacidad llegue a los validadores. */
  protected readonly form = this.fb.group({
    espacioId: this.fb.control<Espacio | null>(null, obligatorio),
    fecha: this.fb.nonNullable.control('', [obligatorio, fechaNoPasada()]),
    horaInicio: this.fb.nonNullable.control('', [obligatorio, horaInicioNoPasada('fecha')]),
    horaFin: this.fb.nonNullable.control('', [obligatorio, horaFinPosterior('horaInicio')]),
    asistentes: this.fb.control<number | null>(null, [obligatorio, enteroMinimo(), dentroDeCapacidad('espacioId')]),
  });
  protected readonly mensajes = MENSAJES;
  protected readonly minimoFecha = ahoraEnZona().fecha;

  protected readonly enviando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly creada = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];

  protected readonly textoConfirmar = MSG.reserva.confirmar;
  protected readonly textoExito = MSG.reserva.creada;

  constructor() {
    const c = this.form.controls;
    // Validacion entre campos: cada una se reevalua cuando cambia el campo del que depende.
    revalidarAlCambiar(c.fecha, c.horaInicio, this.destroyRef);
    revalidarAlCambiar(c.horaInicio, c.horaFin, this.destroyRef);
    revalidarAlCambiar(c.espacioId, c.asistentes, this.destroyRef);
    // Un rechazo del servidor (por ejemplo, disponibilidad) deja de valer en cuanto cambia cualquier dato.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      Object.values(this.form.controls)
        .filter((control) => control.hasError('servidor'))
        .forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
    });
  }

  ngOnInit(): void {
    this.espaciosApi.consultarEspacios().subscribe({
      next: (lista) => {
        this.cargado.set(true);
        if (lista.length === 0) {
          // Sin espacios: se informa y se regresa a Gestionar Reservas (Mis reservas).
          this.avisar(MSG.reserva.sinEspacios, undefined, () => this.router.navigateByUrl('/mis-reservas'));
          return;
        }
        this.espacios.set(lista);
        const id = Number(this.route.snapshot.queryParamMap.get('espacioId'));
        const preseleccionado = lista.find((e) => e.id === id) ?? null;
        this.seleccionado.set(preseleccionado);
        this.form.controls.espacioId.setValue(preseleccionado);
      },
      error: () => {
        this.cargado.set(true);
        this.avisar(MSG.comunes.errorServidor, undefined, () => this.router.navigateByUrl('/mis-reservas'));
      },
    });
  }

  protected elegir(espacio: Espacio): void {
    this.seleccionado.set(espacio);
    this.form.controls.espacioId.setValue(espacio);
    this.form.controls.espacioId.markAsTouched();
  }

  /** Reservar: valida en el cliente y en el servidor (datos, capacidad, disponibilidad) y pide confirmar. */
  protected reservar(): void {
    if (this.enviando() || this.confirmando()) return;
    // La hora actual cambia con el tiempo: se vuelve a evaluar todo antes de decidir.
    Object.values(this.form.controls).forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
    this.form.markAllAsTouched();
    const errores = listarErrores(this.form, ETIQUETAS, MENSAJES);
    if (errores.length > 0) {
      const soloCapacidad = errores.length === 1 && this.form.controls.asistentes.hasError('capacidad');
      // Paso 7 de la especificacion: la capacidad excedida tiene su propio mensaje literal.
      const titulo = soloCapacidad ? MSG.reserva.capacidadExcedida : MSG.comunes.datosInvalidos;
      const detalle = soloCapacidad ? undefined : errores.map((x) => `${x.etiqueta}: ${x.texto}`);
      this.avisar(titulo, detalle, () => this.enfocar(errores[0].campo as Campo));
      return;
    }
    this.enviando.set(true);
    this.reservasApi.validarReserva(this.solicitud()).subscribe({
      next: () => {
        this.enviando.set(false);
        const v = this.form.getRawValue();
        this.datosConfirmacion = [
          { etiqueta: 'Espacio', valor: this.seleccionado()!.nombre },
          { etiqueta: 'Fecha', valor: formatearFechaLarga(v.fecha) },
          { etiqueta: 'Horario', valor: `${v.horaInicio} a ${v.horaFin}` },
          { etiqueta: 'Asistentes', valor: String(v.asistentes) },
        ];
        this.confirmando.set(true);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.alFallar(error);
      },
    });
  }

  /** «No» (o Esc, o clic afuera): se cierra el modal, no se registra nada y los datos se conservan. */
  protected rechazarConfirmacion(): void {
    this.confirmando.set(false);
  }

  protected confirmarReserva(): void {
    this.confirmando.set(false);
    this.enviando.set(true);
    this.reservasApi.crearReserva(this.solicitud()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.creada.set(true);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.alFallar(error);
      },
    });
  }

  /** «Aceptar» en el mensaje de exito: vuelve a Mis reservas, donde ya se ve la reserva nueva. */
  protected aceptarExito(): void {
    this.router.navigateByUrl('/mis-reservas');
  }

  private solicitud(): SolicitudReserva {
    const v = this.form.getRawValue();
    return {
      espacioId: v.espacioId!.id!,
      fecha: v.fecha,
      horaInicio: v.horaInicio,
      horaFin: v.horaFin,
      asistentes: Number(v.asistentes),
    };
  }

  /** Traduce los codigos del servidor a texto (validation-messages.ts), los muestra con Aceptar, marca el campo y deja los datos como estaban. */
  private alFallar(error: unknown): void {
    const http = error instanceof HttpErrorResponse ? error : null;
    let titulo: string = MSG.comunes.errorServidor;
    let detalle: string[] | undefined;
    let campo: Campo | null = null;
    if (http?.status === 403) {
      titulo = MSG.espacio.sinPermiso;
    } else if (http?.status === 400 || http?.status === 409) {
      titulo = textoDeMensaje(http.error?.mensaje);
      const campos = (http.error?.campos ?? {}) as Record<string, string>;
      const lista: string[] = [];
      for (const [nombre, valor] of Object.entries(campos)) {
        const texto = textoDeCodigo(nombre, valor);
        if (nombre in this.form.controls) {
          marcarErrorServidor(this.form.controls[nombre as Campo], texto);
          campo ??= nombre as Campo;
        }
        lista.push(`${ETIQUETAS[nombre as Campo] ?? nombre}: ${texto}`);
      }
      // Cuando el titulo ya es el texto del campo (capacidad, disponibilidad) no se repite como detalle.
      if (titulo === MSG.comunes.datosInvalidos) detalle = lista.length > 0 ? lista : undefined;
    }
    this.avisar(titulo, detalle, () => campo && this.enfocar(campo));
  }

  private avisar(titulo: string, detalle: string[] | undefined, alAceptar: () => unknown): void {
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
    ref.closed.subscribe(() => alAceptar());
  }

  private enfocar(campo: Campo): void {
    const destino = campo === 'espacioId' ? document.querySelector<HTMLElement>('sb-space-card') : document.getElementById(campo);
    destino?.focus();
  }
}
