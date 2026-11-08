import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type WordmarkVariante = 'claro' | 'oscuro' | 'mono';

@Component({
  selector: 'sb-wordmark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="marca" [class]="'marca ' + variante()" [style.font-size.px]="size()" role="img" aria-label="StudyBook"
    ><span aria-hidden="true">Study</span><span class="book" aria-hidden="true">Book</span></span
  >`,
  styles: `
    :host { display: inline-block; }
    .marca {
      display: inline-flex; align-items: center; font-family: var(--sb-font-brand);
      font-weight: 800; line-height: 1; letter-spacing: -0.03em; white-space: nowrap;
    }
    .book {
      margin-left: 0.08em; padding: 0.06em 0.22em 0.1em; border-radius: 0.26em;
      background: var(--sb-accent); color: var(--sb-on-accent);
    }
    .claro { color: var(--sb-bg); }
    .oscuro { color: var(--sb-primary-600); }
    .mono { color: var(--sb-text); }
    .mono .book { background: var(--sb-text); color: var(--sb-bg); }
  `,
})
export class SbWordmarkComponent {
  /** Tamano de fuente en px. */
  readonly size = input(22);
  /** claro: sobre fondo verde. oscuro: sobre fondo claro. mono: una sola tinta. */
  readonly variante = input<WordmarkVariante>('claro');
}
