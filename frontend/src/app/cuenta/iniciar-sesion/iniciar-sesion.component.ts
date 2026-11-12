import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MSG } from '../../compartido/messages';
import { opcionesDialogoMensaje, DialogoMensajeComponent } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { SbIconComponent } from '../../compartido/ui/sb-icon/sb-icon.component';
import { SbWordmarkComponent } from '../../compartido/ui/sb-wordmark/sb-wordmark.component';
import { SesionService } from '../../core/sesion.service';
import { CuentaService } from '../cuenta.service';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'sb-iniciar-sesion',
  imports: [ReactiveFormsModule, RouterLink, SbIconComponent, SbWordmarkComponent],
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
    correo: ['', [Validators.required, Validators.pattern(FORMATO_CORREO)]],
    clave: ['', Validators.required],
  });
  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);

  /** Mensaje de error por campo (vacio si el campo es valido). */
  protected errorCorreo(): string {
    const c = this.form.controls.correo;
    if (c.hasError('required')) return MSG.cuenta.correoObligatorio;
    return c.hasError('pattern') ? MSG.cuenta.correoFormato : '';
  }

  protected errorClave(): string {
    return this.form.controls.clave.hasError('required') ? MSG.cuenta.claveObligatoria : '';
  }

  protected mostrarErrorCorreo(): boolean {
    return this.intentado() && this.errorCorreo() !== '';
  }

  protected mostrarErrorClave(): boolean {
    return this.intentado() && this.errorClave() !== '';
  }

  protected enviar(): void {
    if (this.enviando()) return;
    this.intentado.set(true);
    const errores = [this.errorCorreo(), this.errorClave()].filter((e) => e !== '');
    if (errores.length > 0) {
      this.mostrarMensaje(MSG.comunes.datosInvalidos, errores, () => {
        (this.errorCorreo() ? this.correoEl() : this.claveEl()).nativeElement.focus();
      });
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
      this.mostrarMensaje(MSG.comunes.datosInvalidos, Object.values((error as HttpErrorResponse).error?.campos ?? {}), () =>
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
