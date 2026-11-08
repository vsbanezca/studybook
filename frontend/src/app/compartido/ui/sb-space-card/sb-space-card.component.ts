import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SbIconComponent } from '../sb-icon/sb-icon.component';
import { Espacio } from '../../../espacios/espacio.model';

export type ModoTarjeta = 'reservar' | 'ver' | 'selectable';

@Component({
  selector: 'sb-space-card',
  imports: [SbIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selectable]': "modo() === 'selectable'",
    '[class.seleccionada]': "modo() === 'selectable' && seleccionado()",
    '[attr.role]': "modo() === 'selectable' ? 'radio' : null",
    '[attr.aria-checked]': "modo() === 'selectable' ? seleccionado() : null",
    '[attr.tabindex]': "modo() === 'selectable' ? 0 : null",
    '(click)': 'alClic()',
    '(keydown.enter)': 'alTecla($event)',
    '(keydown.space)': 'alTecla($event)',
  },
  template: `
    <div class="cabecera">
      <h3 class="nombre">{{ espacio().nombre }}</h3>
      @if (modo() === 'selectable') {
        <span class="radio" [class.marcado]="seleccionado()" aria-hidden="true">
          @if (seleccionado()) {
            <sb-icon nombre="check" />
          }
        </span>
      }
    </div>
    <ul class="datos">
      <li><sb-icon nombre="map-pin" />{{ espacio().ubicacion }}</li>
      <li><sb-icon nombre="building-2" />Piso {{ espacio().piso }}</li>
      <li><sb-icon nombre="users" />Hasta {{ espacio().capacidad }} personas</li>
    </ul>
    <button type="button" class="enlace" (click)="alVerEquipamiento($event)">
      Ver equipamiento <sb-icon nombre="chevron-right" />
    </button>
    @if (modo() === 'reservar') {
      <button type="button" class="sb-btn sb-btn-primario sb-btn-bloque" (click)="alReservar($event)">Reservar</button>
    }
  `,
  styles: `
    :host {
      display: flex; flex-direction: column; gap: var(--sb-space-3); box-sizing: border-box;
      padding: var(--sb-space-4); background: var(--sb-bg); border-radius: var(--sb-radius-card);
      box-shadow: var(--sb-shadow-card); border: 2px solid transparent;
    }
    :host(.selectable) { cursor: pointer; }
    :host(.seleccionada) { border-color: var(--sb-primary-600); background: var(--sb-primary-50); }
    .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sb-space-3); }
    .nombre { margin: 0; font-size: 16px; line-height: 22px; font-weight: 500; }
    .radio {
      flex: none; display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: var(--sb-radius-pill);
      border: 2px solid var(--sb-field-border); background: var(--sb-bg); color: var(--sb-bg); font-size: 12px;
    }
    .radio.marcado { background: var(--sb-primary-600); border-color: var(--sb-primary-600); }
    .datos { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sb-space-1); }
    .datos li { display: flex; align-items: center; gap: var(--sb-space-2); color: var(--sb-text-muted); }
    .datos sb-icon { font-size: 16px; }
    .enlace {
      align-self: flex-start; display: inline-flex; align-items: center; gap: var(--sb-space-1);
      min-height: var(--sb-control-h); padding: 0; border: 0; background: none; cursor: pointer;
      color: var(--sb-primary-600); font: inherit; font-weight: 500;
    }
    .enlace sb-icon { font-size: 14px; }
    .enlace:hover { color: var(--sb-primary-700); text-decoration: underline; }
  `,
})
export class SbSpaceCardComponent {
  readonly espacio = input.required<Espacio>();
  readonly modo = input<ModoTarjeta>('ver');
  readonly seleccionado = input(false);

  readonly reservar = output<Espacio>();
  readonly seleccionar = output<Espacio>();
  readonly verEquipamiento = output<Espacio>();

  protected alClic(): void {
    if (this.modo() === 'selectable') {
      this.seleccionar.emit(this.espacio());
    }
  }

  protected alTecla(ev: Event): void {
    if (this.modo() === 'selectable' && ev.target === ev.currentTarget) {
      ev.preventDefault();
      this.seleccionar.emit(this.espacio());
    }
  }

  protected alVerEquipamiento(ev: Event): void {
    ev.stopPropagation();
    this.verEquipamiento.emit(this.espacio());
  }

  protected alReservar(ev: Event): void {
    ev.stopPropagation();
    this.reservar.emit(this.espacio());
  }
}
