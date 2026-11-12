import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { normalizarTelefono, telefonoValidator } from '../../compartido/telefono';
import { DatoConfirmacion, SbConfirmDialogComponent } from '../../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { SbWordmarkComponent } from '../../compartido/ui/sb-wordmark/sb-wordmark.component';
import { CuentaService } from '../cuenta.service';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// SUPOSICION: mismos dominios que `studybook.registro.dominios` del backend (el servidor sigue siendo quien decide).
// Si cambia la propiedad del servidor, hay que cambiar esta lista.
const DOMINIOS_INSTITUCIONALES = ['ucab.edu.ve', 'est.ucab.edu.ve'];

/** Con formato de correo valido, el dominio completo (despues de la ultima @) debe ser exactamente uno de la lista. */
const dominioInstitucionalValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = ((control.value as string | null) ?? '').trim().toLowerCase();
  if (!FORMATO_CORREO.test(valor)) return null; // vacio y formato los reportan sus propios validadores
  const dominio = valor.substring(valor.lastIndexOf('@') + 1);
  return DOMINIOS_INSTITUCIONALES.includes(dominio) ? null : { dominio: true };
};

// SUPOSICION: cedula solo con digitos (a confirmar con el equipo). El telefono usa la regla compartida de compartido/telefono.ts.
const SOLO_DIGITOS = /^\d+$/;
const LARGO_MINIMO_CLAVE = 8; // SUPOSICION: minimo 8 caracteres
const LARGO_MAXIMO_CLAVE = 72; // limite tecnico de BCrypt en el servidor

type Campo = 'nombre' | 'cedula' | 'correo' | 'telefono' | 'clave';

const ETIQUETAS: Record<Campo, string> = {
  nombre: 'Nombre',
  cedula: 'Cédula',
  correo: 'Correo institucional',
  telefono: 'Teléfono',
  clave: 'Contraseña',
};

const ORDEN: Campo[] = ['nombre', 'cedula', 'correo', 'telefono', 'clave'];

@Component({
  selector: 'sb-registrarse',
  imports: [ReactiveFormsModule, RouterLink, SbConfirmDialogComponent, SbIconComponent, SbMessageComponent, SbWordmarkComponent],
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
    nombre: ['', Validators.required],
    cedula: ['', [Validators.required, Validators.pattern(SOLO_DIGITOS)]],
    correo: ['', [Validators.required, Validators.pattern(FORMATO_CORREO), dominioInstitucionalValidator]],
    telefono: ['', [Validators.required, telefonoValidator]],
    clave: ['', [Validators.required, Validators.minLength(LARGO_MINIMO_CLAVE), Validators.maxLength(LARGO_MAXIMO_CLAVE)]],
  });

  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly registrado = signal(false);
  protected datosConfirmacion: DatoConfirmacion[] = [];

  protected readonly textoConfirmar = MSG.cuenta.confirmar;
  protected readonly textoExito = MSG.cuenta.creada;

  /** Texto de error de un campo (vacio si es valido). */
  protected errorDe(campo: Campo): string {
    const c = this.form.controls[campo];
    if (c.hasError('required')) {
      return {
        nombre: MSG.cuenta.nombreObligatorio,
        cedula: MSG.cuenta.cedulaObligatoria,
        correo: MSG.cuenta.correoObligatorio,
        telefono: MSG.cuenta.telefonoObligatorio,
        clave: MSG.cuenta.claveObligatoria,
      }[campo];
    }
    if (c.hasError('maxlength')) {
      return MSG.cuenta.claveLarga;
    }
    if (c.hasError('telefono')) {
      return MSG.cuenta.telefonoFormato;
    }
    if (c.hasError('dominio')) {
      return MSG.cuenta.correoNoInstitucional;
    }
    if (c.hasError('pattern') || c.hasError('minlength')) {
      return {
        nombre: '',
        cedula: MSG.cuenta.cedulaFormato,
        correo: MSG.cuenta.correoFormato,
        telefono: MSG.cuenta.telefonoFormato,
        clave: MSG.cuenta.claveCorta,
      }[campo];
    }
    return '';
  }

  /**
   * Tras intentar enviar se muestran todos los errores. Antes, el correo muestra su error en cuanto el usuario
   * sale del campo (blur) con algo escrito: formato o dominio no institucional. Vacio no se marca hasta enviar.
   */
  protected mostrarError(campo: Campo): boolean {
    if (this.errorDe(campo) === '') return false;
    if (this.intentado()) return true;
    const c = this.form.controls[campo];
    return campo === 'correo' && c.touched && c.value.trim() !== '';
  }

  /** Valida y, si todo esta bien, pide la confirmacion Si/No con el resumen (sin la contrasena). */
  protected solicitarConfirmacion(): void {
    if (this.enviando() || this.confirmando()) return;
    this.intentado.set(true);
    const invalidos = ORDEN.filter((c) => this.errorDe(c) !== '');
    if (invalidos.length > 0) {
      const detalle = invalidos.map((c) => `${ETIQUETAS[c]}: ${this.errorDe(c)}`);
      const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.datosInvalidos, detalle }));
      ref.closed.subscribe(() => document.getElementById(invalidos[0])?.focus());
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
    if (http?.status === 400) {
      titulo = http.error?.mensaje ?? MSG.comunes.datosInvalidos;
      const campos = http.error?.campos;
      if (campos && typeof campos === 'object') {
        const lista = Object.entries(campos).map(([campo, texto]) => `${ETIQUETAS[campo as Campo] ?? campo}: ${texto}`);
        detalle = lista.length > 0 ? lista : undefined;
      }
    }
    this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle }));
  }
}
