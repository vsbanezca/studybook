import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbCampoDirective, SbFieldErrorComponent } from '../../compartido/ui/sb-field-error/sb-field-error.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { Mensajes, listarErrores, textoDeCodigo, textoDeMensaje } from '../../compartido/validacion/validation-messages';
import { enteroMinimo, marcarErrorServidor, obligatorio } from '../../compartido/validacion/validators';
import { Espacio } from '../../espacios/espacio.model';
import { EspacioService } from '../../espacios/espacio.service';
import { EquipamientoService } from '../equipamiento.service';

type Campo = 'nombre' | 'categoria' | 'estado' | 'cantidad' | 'descripcion';

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre',
  categoria: 'Categoría',
  estado: 'Estado',
  cantidad: 'Cantidad',
  descripcion: 'Descripción',
};

const MENSAJES: Record<string, Mensajes> = {
  cantidad: { entero: MSG.equipamiento.cantidadInvalida },
};

// SUPOSICION: el brief no define largos ni formato para estos campos; solo obligatorio y el tipo basico.
@Component({
  selector: 'app-crear-equipamiento',
  imports: [ReactiveFormsModule, RouterLink, SbCampoDirective, SbConfirmDialogComponent, SbFieldErrorComponent, SbMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-equipamiento.component.html',
  styleUrl: './crear-equipamiento.component.css',
})
export class CrearEquipamientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly espacios = inject(EspacioService);
  private readonly equipamientos = inject(EquipamientoService);

  protected espacioId = 0;
  protected readonly espacio = signal<Espacio | null>(null);

  protected readonly form = this.fb.group({
    nombre: ['', obligatorio],
    categoria: ['', obligatorio],
    estado: ['', obligatorio],
    cantidad: this.fb.control<number | null>(1, [obligatorio, enteroMinimo()]),
    descripcion: ['', obligatorio],
  });
  protected readonly mensajes = MENSAJES;

  protected readonly enviando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly creado = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];

  protected readonly textoConfirmar = MSG.equipamiento.confirmar;
  protected readonly textoExito = MSG.equipamiento.creado;

  ngOnInit(): void {
    this.espacioId = Number(this.route.snapshot.paramMap.get('id'));
    this.espacios.consultarEspacios().subscribe({
      next: (todos) => {
        const encontrado = todos.find((e) => e.id === this.espacioId);
        if (encontrado) {
          this.espacio.set(encontrado);
        } else {
          this.avisarYVolver(MSG.equipamiento.espacioNoExiste);
        }
      },
      error: () => this.avisarYVolver(MSG.comunes.errorServidor),
    });
  }

  protected solicitarConfirmacion(): void {
    if (this.enviando() || this.confirmando()) return;
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
      { etiqueta: 'Espacio', valor: this.espacio()?.nombre ?? '' },
      { etiqueta: 'Nombre', valor: v.nombre.trim() },
      { etiqueta: 'Categoría', valor: v.categoria.trim() },
      { etiqueta: 'Estado', valor: v.estado.trim() },
      { etiqueta: 'Cantidad', valor: String(v.cantidad) },
    ];
    this.confirmando.set(true);
  }

  /** «No» (o Esc, o clic afuera): se cierra el modal y los datos se conservan. */
  protected rechazarConfirmacion(): void {
    this.confirmando.set(false);
  }

  protected confirmarCreacion(): void {
    this.confirmando.set(false);
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.equipamientos
      .crearEquipamiento({
        nombre: v.nombre.trim(),
        categoria: v.categoria.trim(),
        estado: v.estado.trim(),
        cantidad: Number(v.cantidad),
        descripcion: v.descripcion.trim(),
        espacioId: this.espacioId,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.creado.set(true);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.alFallar(error);
        },
      });
  }

  /** «Aceptar» en el mensaje de exito: vuelve a la lista de equipamiento del espacio. */
  protected aceptarExito(): void {
    this.router.navigateByUrl(`/espacios/${this.espacioId}/equipamiento`);
  }

  private alFallar(error: unknown): void {
    const http = error instanceof HttpErrorResponse ? error : null;
    let titulo: string = MSG.comunes.errorServidor;
    let detalle: string[] | undefined;
    let primero: Campo | null = null;
    if (http?.status === 403) {
      titulo = MSG.espacio.sinPermiso;
    } else if (http?.status === 400 || http?.status === 404) {
      titulo = textoDeMensaje(http.error?.mensaje);
      const campos = (http.error?.campos ?? {}) as Record<string, string>;
      const lista: string[] = [];
      for (const [campo, valor] of Object.entries(campos)) {
        const texto = textoDeCodigo(campo, valor);
        if (campo in this.form.controls) {
          marcarErrorServidor(this.form.controls[campo as Campo], texto);
          primero ??= campo as Campo;
        }
        lista.push(`${ETIQUETAS[campo as Campo] ?? campo}: ${texto}`);
      }
      detalle = titulo === MSG.comunes.datosInvalidos && lista.length > 0 ? lista : undefined;
    }
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
    ref.closed.subscribe(() => primero && document.getElementById(primero)?.focus());
  }

  private avisarYVolver(titulo: string): void {
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo }));
    ref.closed.subscribe(() => this.router.navigateByUrl('/espacios'));
  }
}
