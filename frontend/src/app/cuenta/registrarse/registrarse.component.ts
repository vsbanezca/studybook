import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { normalizarTelefono } from '../../compartido/telefono';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbCampoDirective, SbFieldErrorComponent } from '../../compartido/ui/sb-field-error/sb-field-error.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { SbWordmarkComponent } from '../../compartido/ui/sb-wordmark/sb-wordmark.component';
import { Mensajes, listarErrores, textoDeCodigo } from '../../compartido/validacion/validation-messages';
import { REGLAS } from '../../compartido/validacion/validation-rules';
import {
  bytesMaximos, correoValido, dominioInstitucional, largoMinimo, marcarErrorServidor, obligatorio, soloDigitos, telefonoValidator,
} from '../../compartido/validacion/validators';
import { CuentaService } from '../cuenta.service';

type Campo = 'nombre' | 'cedula' | 'correo' | 'telefono' | 'clave';

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre',
  cedula: 'Cédula',
  correo: 'Correo institucional',
  telefono: 'Teléfono',
  clave: 'Contraseña',
};

/** Textos propios de cada campo (los que ya tenia la pantalla); lo demas sale del catalogo compartido. */
const MENSAJES: Record<Campo, Mensajes> = {
  nombre: { required: MSG.cuenta.nombreObligatorio },
  cedula: { required: MSG.cuenta.cedulaObligatoria, digitos: MSG.cuenta.cedulaFormato },
  correo: { required: MSG.cuenta.correoObligatorio, correo: MSG.cuenta.correoFormato, dominio: MSG.cuenta.correoNoInstitucional },
  telefono: { required: MSG.cuenta.telefonoObligatorio, telefono: MSG.cuenta.telefonoFormato },
  clave: { required: MSG.cuenta.claveObligatoria, minlength: MSG.cuenta.claveCorta, maxlength: MSG.cuenta.claveLarga },
};

@Component({
  selector: 'sb-registrarse',
  imports: [
    ReactiveFormsModule, RouterLink, SbCampoDirective, SbConfirmDialogComponent, SbFieldErrorComponent, SbIconComponent,
    SbMessageComponent, SbWordmarkComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registrarse.component.html',
  styleUrl: './registrarse.component.css',
})
export class RegistrarseComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly cuentas = inject(CuentaService);

  protected readonly form = this.fb.group({
    nombre: ['', obligatorio],
    cedula: ['', [obligatorio, soloDigitos]],
    correo: ['', [obligatorio, correoValido, dominioInstitucional]],
    telefono: ['', [obligatorio, telefonoValidator]],
    clave: ['', [obligatorio, largoMinimo(REGLAS.clave.minimo), bytesMaximos(REGLAS.clave.maximoBytes)]],
  });

  protected readonly mensajes = MENSAJES;
  protected readonly minimoClave = REGLAS.clave.minimo;
  protected readonly enviando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly registrado = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];

  protected readonly textoConfirmar = MSG.cuenta.confirmar;
  protected readonly textoExito = MSG.cuenta.creada;

  /** Requisito visible de la contrasena: cambia de estado en vivo, en cada tecla. */
  protected claveCumpleMinimo(): boolean {
    return this.form.controls.clave.value.length >= this.minimoClave;
  }

  /** Valida y, si todo esta bien, pide la confirmacion Si/No con el resumen (sin la contrasena). */
  protected solicitarConfirmacion(): void {
    if (this.enviando() || this.confirmando()) return;
    this.form.markAllAsTouched();
    const invalidos = listarErrores(this.form, ETIQUETAS, MENSAJES);
    if (invalidos.length > 0) {
      const detalle = invalidos.map((e) => `${e.etiqueta}: ${e.texto}`);
      const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.datosInvalidos, detalle }));
      ref.closed.subscribe(() => this.enfocar(invalidos[0].campo));
      return;
    }
    const v = this.form.getRawValue();
    this.datosConfirmacion = [
      { etiqueta: 'Nombre', valor: v.nombre.trim() },
      { etiqueta: 'Cédula', valor: v.cedula.trim() },
      { etiqueta: 'Correo', valor: v.correo.trim() },
      { etiqueta: 'Teléfono', valor: normalizarTelefono(v.telefono) },
    ];
    this.confirmando.set(true);
  }

  /** «No» (o Esc, o clic afuera): se cierra el modal y el formulario conserva los datos. */
  protected rechazarConfirmacion(): void {
    this.confirmando.set(false);
  }

  protected confirmarRegistro(): void {
    this.confirmando.set(false);
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.cuentas
      .registrar({ nombre: v.nombre.trim(), cedula: v.cedula.trim(), correo: v.correo.trim(), telefono: normalizarTelefono(v.telefono), clave: v.clave })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.registrado.set(true);
        },
        error: (error: unknown) => {
          this.enviando.set(false);
          this.alFallar(error);
        },
      });
  }

  /** «Aceptar» en el mensaje de exito: la cuenta ya existe, se va a Iniciar sesion. */
  protected aceptarExito(): void {
    this.router.navigateByUrl('/iniciar-sesion');
  }

  private alFallar(error: unknown): void {
    const http = error instanceof HttpErrorResponse ? error : null;
    let titulo: string = MSG.comunes.errorServidor;
    let detalle: string[] | undefined;
    let primero: Campo | null = null;
    if (http?.status === 400) {
      titulo = http.error?.mensaje ?? MSG.comunes.datosInvalidos;
      const campos = (http.error?.campos ?? {}) as Record<string, string>;
      const lista: string[] = [];
      for (const [campo, valor] of Object.entries(campos)) {
        if (!(campo in this.form.controls)) continue;
        const texto = textoDeCodigo(campo, valor);
        // Ademas del modal, el error queda marcado en el campo y se limpia al editarlo.
        marcarErrorServidor(this.form.controls[campo as Campo], texto);
        primero ??= campo as Campo;
        lista.push(`${ETIQUETAS[campo as Campo]}: ${texto}`);
      }
      // Si el titulo ya es el texto del campo (por ejemplo «Ya existe una cuenta con ese correo») no se repite.
      detalle = titulo === MSG.comunes.datosInvalidos && lista.length > 0 ? lista : undefined;
    }
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
    ref.closed.subscribe(() => primero && this.enfocar(primero));
  }

  private enfocar(campo: string): void {
    document.getElementById(campo)?.focus();
  }
}
