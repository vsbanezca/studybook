import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { formatearFechaLarga } from '../../compartido/formato-fecha';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { SbSpaceCardComponent } from '../../compartido/ui/sb-space-card/sb-space-card.component';
import { Espacio } from '../../espacios/espacio.model';
import { EspacioService } from '../../espacios/espacio.service';
import { SolicitudReserva } from '../reserva.model';
import { ReservaService } from '../reserva.service';

type Campo = 'espacioId' | 'fecha' | 'horaInicio' | 'horaFin' | 'asistentes';

interface ErrorCampo {
  campo: Campo;
  etiqueta: string;
  texto: string;
}

const ETIQUETAS: Record<Campo, string> = {
  espacioId: 'Espacio',
  fecha: 'Fecha',
  horaInicio: 'Hora de inicio',
  horaFin: 'Hora de fin',
  asistentes: 'Asistentes',
};

/** Fecha de hoy como AAAA-MM-DD en la zona horaria del navegador. */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

@Component({
  selector: 'app-crear-reserva',
  imports: [FormsModule, RouterLink, SbConfirmDialogComponent, SbIconComponent, SbMessageComponent, SbSpaceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-reserva.component.html',
  styleUrl: './crear-reserva.component.css',
})
export class CrearReservaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly espaciosApi = inject(EspacioService);
  private readonly reservasApi = inject(ReservaService);

  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cargado = signal(false);
  protected readonly seleccionado = signal<Espacio | null>(null);

  protected readonly datos = { fecha: '', horaInicio: '', horaFin: '', asistentes: null as number | null };
  protected readonly minimoFecha = hoy();

  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly creada = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];

  protected readonly textoConfirmar = MSG.reserva.confirmar;
  protected readonly textoExito = MSG.reserva.creada;

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
        this.seleccionado.set(lista.find((e) => e.id === id) ?? null);
      },
      error: () => {
        this.cargado.set(true);
        this.avisar(MSG.comunes.errorServidor, undefined, () => this.router.navigateByUrl('/mis-reservas'));
      },
    });
  }

  protected elegir(espacio: Espacio): void {
    this.seleccionado.set(espacio);
  }

  /** Campos con error, en el orden del formulario. */
  protected errores(): ErrorCampo[] {
    const d = this.datos;
    const obligatorio = MSG.comunes.campoObligatorio;
    const lista: ErrorCampo[] = [];
    const agregar = (campo: Campo, texto: string) => lista.push({ campo, etiqueta: ETIQUETAS[campo], texto });
    if (!this.seleccionado()) agregar('espacioId', MSG.reserva.espacioObligatorio);
    if (!d.fecha) agregar('fecha', obligatorio);
    else if (d.fecha < hoy()) agregar('fecha', MSG.reserva.fechaPasada);
    if (!d.horaInicio) agregar('horaInicio', obligatorio);
    if (!d.horaFin) agregar('horaFin', obligatorio);
    else if (d.horaInicio && d.horaFin <= d.horaInicio) agregar('horaFin', MSG.reserva.finNoPosterior);
    if (d.asistentes === null || d.asistentes === undefined || (d.asistentes as unknown) === '') agregar('asistentes', obligatorio);
    else if (!Number.isInteger(d.asistentes) || d.asistentes < 1) agregar('asistentes', MSG.reserva.asistentesInvalidos);
    return lista;
  }

  protected errorDe(campo: Campo): string {
    return this.intentado() ? (this.errores().find((x) => x.campo === campo)?.texto ?? '') : '';
  }

  /** Reservar: valida en el cliente y en el servidor (datos, capacidad, disponibilidad) y pide confirmar. */
  protected reservar(): void {
    if (this.enviando() || this.confirmando()) return;
    this.intentado.set(true);
    const errores = this.errores();
    if (errores.length > 0) {
      const detalle = errores.map((x) => `${x.etiqueta}: ${x.texto}`);
      this.avisar(MSG.comunes.datosInvalidos, detalle, () => this.enfocar(errores[0].campo));
      return;
    }
    this.enviando.set(true);
    this.reservasApi.validarReserva(this.solicitud()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.datosConfirmacion = [
          { etiqueta: 'Espacio', valor: this.seleccionado()!.nombre },
          { etiqueta: 'Fecha', valor: formatearFechaLarga(this.datos.fecha) },
          { etiqueta: 'Horario', valor: `${this.datos.horaInicio} a ${this.datos.horaFin}` },
          { etiqueta: 'Asistentes', valor: String(this.datos.asistentes) },
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
    return {
      espacioId: this.seleccionado()!.id!,
      fecha: this.datos.fecha,
      horaInicio: this.datos.horaInicio,
      horaFin: this.datos.horaFin,
      asistentes: Number(this.datos.asistentes),
    };
  }

  /** Muestra el texto del servidor (literal de la especificacion) con Aceptar y deja los datos tal como estaban. */
  private alFallar(error: unknown): void {
    const http = error instanceof HttpErrorResponse ? error : null;
    let titulo: string = MSG.comunes.errorServidor;
    let detalle: string[] | undefined;
    let campo: Campo | null = null;
    if (http?.status === 403) {
      titulo = MSG.espacio.sinPermiso;
    } else if (http?.status === 400 || http?.status === 409) {
      titulo = http.error?.mensaje ?? MSG.comunes.datosInvalidos;
      const campos = (http.error?.campos ?? {}) as Record<string, string>;
      campo = (Object.keys(campos)[0] as Campo | undefined) ?? null;
      // Cuando el titulo ya es el texto del campo (capacidad, disponibilidad) no se repite como detalle.
      if (titulo === MSG.comunes.datosInvalidos) {
        const lista = Object.entries(campos).map(([c, texto]) => `${ETIQUETAS[c as Campo] ?? c}: ${texto}`);
        detalle = lista.length > 0 ? lista : undefined;
      }
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
