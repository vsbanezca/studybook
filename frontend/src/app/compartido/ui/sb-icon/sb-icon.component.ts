import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONOS, NombreIcono } from './iconos';

/**
 * Icono de Lucide. Mide 1em: el contenedor define el font-size.
 * Hereda el color con currentColor. Los SVG vienen de un mapa propio y constante
 * (iconos.ts), nunca de datos del usuario.
 */
@Component({
  selector: 'sb-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[innerHTML]': 'html()', 'aria-hidden': 'true', style: 'display: inline-flex; flex: none; line-height: 1;' },
  template: '',
})
export class SbIconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly nombre = input.required<NombreIcono>();

  protected readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
        `aria-hidden="true" focusable="false">${ICONOS[this.nombre()]}</svg>`,
    ),
  );
}
