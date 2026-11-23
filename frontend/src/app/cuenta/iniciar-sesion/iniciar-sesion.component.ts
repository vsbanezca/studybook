import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MSG } from '../../compartido/messages';
import { opcionesDialogoMensaje, DialogoMensajeComponent } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { SbCampoDirective, SbFieldErrorComponent } from '../../compartido/ui/sb-field-error/sb-field-error.component';
import { SbWordmarkComponent } from '../../compartido/ui/sb-wordmark/sb-wordmark.component';
import { Mensajes, listarErrores, textoDeCodigo } from '../../compartido/validacion/validation-messages';
import { correoValido, obligatorio } from '../../compartido/validacion/validators';
import { SesionService } from '../../core/sesion.service';
import { CuentaService } from '../cuenta.service';

const ETIQUETAS = { correo: 'Correo', clave: 'Contraseña' };

/** Solo obligatorio y formato de correo: sin dominio institucional ni largo de contrasena (lo dice la especificacion). */
const MENSAJES: Record<string, Mensajes> = {
  correo: { required: MSG.cuenta.correoObligatorio, correo: MSG.cuenta.correoFormato },
  clave: { required: MSG.cuenta.claveObligatoria },
};

@Component({
  selector: 'sb-iniciar-sesion',
  imports: [ReactiveFormsModule, RouterLink, SbCampoDirective, SbFieldErrorComponent, SbWordmarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './iniciar-sesion.component.html',
  styleUrl: './iniciar-sesion.component.css',
})
export class IniciarSesionComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly cuentas = inject(CuentaService);
  private readonly sesion = inject(SesionService);

  private readonly correoEl = viewChild.required<ElementRef<HTMLInputElement>>('correoEl');
  private readonly claveEl = viewChild.required<ElementRef<HTMLInputElement>>('claveEl');

  protected readonly form = this.fb.group({
    correo: ['', [obligatorio, correoValido]],
    clave: ['', obligatorio],
  });
  protected readonly mensajes = MENSAJES;
  protected readonly enviando = signal(false);

  protected enviar(): void {
    if (this.enviando()) return;
    this.form.markAllAsTouched();
    const errores = listarErrores(this.form, ETIQUETAS, MENSAJES);
    if (errores.length > 0) {
      this.mostrarMensaje(
        MSG.comunes.datosInvalidos,
        errores.map((e) => e.texto),
        () => (errores[0].campo === 'correo' ? this.correoEl() : this.claveEl()).nativeElement.focus(),
      );
      return;
    }
    this.enviando.set(true);
    const { correo, clave } = this.form.getRawValue();
    this.cuentas.iniciarSesion({ correo: correo.trim(), clave }).subscribe({
      next: (sesion) => {
        this.enviando.set(false);
        this.sesion.establecer(sesion);
        this.router.navigateByUrl('/espacios');
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.alFallar(error);
      },
    });
  }

  private alFallar(error: unknown): void {
    const estado = error instanceof HttpErrorResponse ? error.status : 0;
    if (estado === 401) {
      // Se conserva el correo y se limpia la contrasena.
      this.mostrarMensaje(MSG.cuenta.credencialesMal, [], () => {
        this.form.controls.clave.reset('');
        this.claveEl().nativeElement.focus();
      });
    } else if (estado === 400) {
      this.mostrarMensaje(MSG.comunes.datosInvalidos, Object.entries((error as HttpErrorResponse).error?.campos ?? {}).map(([c, t]) => textoDeCodigo(c, String(t))), () =>
        this.correoEl().nativeElement.focus(),
      );
    } else {
      this.mostrarMensaje(MSG.comunes.errorServidor, [], () => this.claveEl().nativeElement.focus());
    }
  }

  private mostrarMensaje(titulo: string, detalle: unknown[], alAceptar: () => void): void {
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo, detalle: detalle as string[] }));
    ref.closed.subscribe(() => alAceptar());
  }
}
