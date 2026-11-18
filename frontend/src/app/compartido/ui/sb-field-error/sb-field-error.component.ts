import { ChangeDetectionStrategy, Component, Directive, ElementRef, inject, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Mensajes, mensajeDeError } from '../../validacion/validation-messages';
import { mostrarError } from '../../validacion/validators';
import { SbIconComponent } from '../sb-icon/sb-icon.component';

/**
 * Error de un campo, debajo del control: icono mas texto (no solo color), dentro de una region aria-live="polite"
 * que siempre ocupa su lugar (16 px) para que el error no mueva el boton al aparecer.
 * Se muestra solo si el campo ya fue tocado (blur o boton principal) y se reevalua en cada tecla.
 * Usa la deteccion de cambios por defecto: el estado del control no es una senal y el padre ya es OnPush.
 */
@Component({
  selector: 'sb-field-error',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="region" aria-live="polite">
      @if (visible()) {
        <span class="sb-error-texto" [id]="idMensaje()"><sb-icon nombre="circle-alert" />{{ texto() }}</span>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .region { min-height: 16px; }
  `,
})
export class SbFieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  /** Id del mensaje; el campo lo apunta con aria-describedby (lo hace la directiva sbCampo). */
  readonly idMensaje = input.required<string>();
  /** Textos propios de este campo por clave de error (por ejemplo, required: «El correo es obligatorio»). */
  readonly mensajes = input<Mensajes>({});

  protected visible(): boolean {
    return mostrarError(this.control());
  }

  protected texto(): string {
    return mensajeDeError(this.control().errors, this.mensajes());
  }
}

/**
 * Se pone en el input, select o textarea: aria-invalid cuando hay error visible y aria-describedby apuntando
 * al mensaje (`<id del campo>-error`) y, si existe, a un texto de ayuda.
 */
@Directive({
  selector: '[sbCampo]',
  host: {
    '[attr.aria-invalid]': 'visible() ? "true" : null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class SbCampoDirective {
  readonly sbCampo = input.required<AbstractControl>();
  /** Id de un texto de ayuda que tambien describe al campo (por ejemplo, el requisito de la contrasena). */
  readonly sbAyuda = input<string | null>(null);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  protected visible(): boolean {
    return mostrarError(this.sbCampo());
  }

  protected describedBy(): string | null {
    const ids = [this.visible() ? `${this.el.nativeElement.id}-error` : null, this.sbAyuda()].filter((x) => !!x);
    return ids.length > 0 ? ids.join(' ') : null;
  }
}
