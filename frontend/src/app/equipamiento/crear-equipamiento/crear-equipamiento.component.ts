import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { Espacio } from '../../espacios/espacio.model';
import { EspacioService } from '../../espacios/espacio.service';
import { EquipamientoService } from '../equipamiento.service';

type Campo = 'nombre' | 'categoria' | 'estado' | 'cantidad' | 'descripcion';

interface ErrorCampo {
  campo: Campo;
  etiqueta: string;
  texto: string;
}

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre',
  categoria: 'Categoría',
  estado: 'Estado',
  cantidad: 'Cantidad',
  descripcion: 'Descripción',
};

@Component({
  selector: 'app-crear-equipamiento',
  imports: [FormsModule, RouterLink, SbConfirmDialogComponent, SbIconComponent, SbMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-equipamiento.component.html',
  styleUrl: './crear-equipamiento.component.css',
})
export class CrearEquipamientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly espacios = inject(EspacioService);
  private readonly equipamientos = inject(EquipamientoService);

  protected espacioId = 0;
  protected readonly espacio = signal<Espacio | null>(null);

  protected readonly nuevo = { nombre: '', categoria: '', estado: '', cantidad: 1 as number | null, descripcion: '' };

  protected readonly intentado = signal(false);
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

  /** Campos con error, en el orden del formulario. */
  protected errores(): ErrorCampo[] {
    const lista: ErrorCampo[] = [];
    (['nombre', 'categoria', 'estado', 'descripcion'] as const).forEach((campo) => {
      if (!this.nuevo[campo].trim()) {
        lista.push({ campo, etiqueta: ETIQUETAS[campo], texto: MSG.comunes.campoObligatorio });
      }
    });
    const cantidad = this.nuevo.cantidad;
    if (cantidad === null || cantidad === undefined || (cantidad as unknown) === '') {
      lista.push({ campo: 'cantidad', etiqueta: ETIQUETAS.cantidad, texto: MSG.comunes.campoObligatorio });
    } else if (!Number.isInteger(cantidad) || cantidad < 1) {
      lista.push({ campo: 'cantidad', etiqueta: ETIQUETAS.cantidad, texto: MSG.equipamiento.cantidadInvalida });
    }
    // Los errores siguen el orden del formulario.
    const orden: Campo[] = ['nombre', 'categoria', 'estado', 'cantidad', 'descripcion'];
    lista.sort((a, b) => orden.indexOf(a.campo) - orden.indexOf(b.campo));
    return lista;
  }

  protected errorDe(campo: Campo): string {
    return this.intentado() ? (this.errores().find((x) => x.campo === campo)?.texto ?? '') : '';
  }

  protected solicitarConfirmacion(): void {
    if (this.enviando() || this.confirmando()) return;
    this.intentado.set(true);
    const errores = this.errores();
    if (errores.length > 0) {
      const detalle = errores.map((x) => `${x.etiqueta}: ${x.texto}`);
      const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.datosInvalidos, detalle }));
      ref.closed.subscribe(() => document.getElementById(errores[0].campo)?.focus());
      return;
    }
    this.datosConfirmacion = [
      { etiqueta: 'Espacio', valor: this.espacio()?.nombre ?? '' },
      { etiqueta: 'Nombre', valor: this.nuevo.nombre.trim() },
      { etiqueta: 'Categoría', valor: this.nuevo.categoria.trim() },
      { etiqueta: 'Estado', valor: this.nuevo.estado.trim() },
      { etiqueta: 'Cantidad', valor: String(this.nuevo.cantidad) },
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
    this.equipamientos
      .crearEquipamiento({
        nombre: this.nuevo.nombre.trim(),
        categoria: this.nuevo.categoria.trim(),
        estado: this.nuevo.estado.trim(),
        cantidad: Number(this.nuevo.cantidad),
        descripcion: this.nuevo.descripcion.trim(),
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
    if (http?.status === 403) {
      titulo = MSG.espacio.sinPermiso;
    } else if (http?.status === 400 || http?.status === 404) {
      titulo = http.error?.mensaje ?? MSG.comunes.datosInvalidos;
      const campos = http.error?.campos;
      if (campos && typeof campos === 'object') {
        const lista = Object.entries(campos).map(([campo, texto]) => `${ETIQUETAS[campo as Campo] ?? campo}: ${texto}`);
        detalle = lista.length > 0 ? lista : undefined;
      }
    }
    this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
  }

  private avisarYVolver(titulo: string): void {
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo }));
    ref.closed.subscribe(() => this.router.navigateByUrl('/espacios'));
  }
}
