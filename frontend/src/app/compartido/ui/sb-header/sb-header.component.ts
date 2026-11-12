import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SbIconComponent } from '../sb-icon/sb-icon.component';
import { NombreIcono } from '../sb-icon/iconos';
import { SbWordmarkComponent } from '../sb-wordmark/sb-wordmark.component';

export type RolHeader = 'miembro' | 'admin' | null;

interface EnlaceNav {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

// TODO: confirmar las rutas reales con el equipo cuando existan en app.routes.ts
const ESPACIOS: EnlaceNav = { etiqueta: 'Espacios', ruta: 'espacios', icono: 'building-2' };
const MIS_RESERVAS: EnlaceNav = { etiqueta: 'Mis reservas', ruta: 'mis-reservas', icono: 'calendar' };
const INICIAR_SESION: EnlaceNav = { etiqueta: 'Iniciar sesión', ruta: 'iniciar-sesion', icono: 'lock' };

@Component({
  selector: 'sb-header',
  imports: [RouterLink, RouterLinkActive, SbIconComponent, SbWordmarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'alClicGlobal($event)',
    '(document:keydown.escape)': 'alEscape()',
  },
  template: `
    <header class="encabezado sb-textura">
      <div class="interior">
        <sb-wordmark [size]="22" variante="claro" />
        <nav class="nav" aria-label="Principal">
          @for (e of enlaces(); track e.ruta) {
            <a class="enlace" [routerLink]="'/' + e.ruta" routerLinkActive="activo" ariaCurrentWhenActive="page">
              <sb-icon [nombre]="e.icono" />
              <span>{{ e.etiqueta }}</span>
            </a>
          }
        </nav>
        @if (rol()) {
          <div class="perfil">
            <button
              type="button"
              class="avatar"
              aria-haspopup="menu"
              [attr.aria-expanded]="menuAbierto()"
              [attr.aria-label]="'Menú de ' + (nombre() || 'usuario')"
              (click)="alternarMenu()"
            >{{ inicial() }}</button>
            @if (menuAbierto()) {
              <div class="menu" role="menu">
                <p class="usuario">{{ nombre() }}</p>
                <button type="button" class="opcion" role="menuitem" (click)="cerrarSesion()">
                  <sb-icon nombre="log-out" />Cerrar sesión
                </button>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: `
    :host { display: block; }
    .encabezado { height: 56px; color: var(--sb-bg); }
    .interior {
      display: flex; align-items: center; gap: var(--sb-space-6); height: 100%;
      max-width: var(--sb-container); margin-inline: auto; padding-inline: var(--sb-space-8);
    }
    .nav { display: flex; gap: var(--sb-space-2); flex: 1; }
    .enlace {
      display: inline-flex; align-items: center; gap: var(--sb-space-2);
      padding: var(--sb-space-2) var(--sb-space-4); border-radius: var(--sb-radius-pill);
      color: var(--sb-bg); text-decoration: none; font-weight: 500;
    }
    .enlace sb-icon { display: none; }
    .enlace:hover { background: var(--sb-primary-700); }
    .enlace.activo { background: var(--sb-bg); color: var(--sb-primary-600); }
    .perfil { position: relative; margin-left: auto; }
    .avatar {
      display: inline-flex; align-items: center; justify-content: center; padding: 0; border: 0; cursor: pointer;
      width: var(--sb-control-h); height: var(--sb-control-h); border-radius: var(--sb-radius-pill);
      background: var(--sb-bg); color: var(--sb-primary-600); font: inherit; font-weight: 500;
    }
    .avatar:hover { background: var(--sb-primary-100); }
    .menu {
      position: absolute; top: calc(100% + var(--sb-space-2)); right: 0; z-index: 20; min-width: 220px;
      padding: var(--sb-space-2); background: var(--sb-bg); color: var(--sb-text);
      border-radius: var(--sb-radius-card); box-shadow: var(--sb-shadow-modal);
    }
    .usuario {
      margin: 0; padding: var(--sb-space-2) var(--sb-space-3) var(--sb-space-3);
      border-bottom: 1px solid var(--sb-border); font-weight: 500; overflow-wrap: anywhere;
    }
    .opcion {
      display: flex; align-items: center; gap: var(--sb-space-2); width: 100%; min-height: var(--sb-control-h);
      margin-top: var(--sb-space-2); padding: 0 var(--sb-space-3); border: 0; border-radius: var(--sb-radius-control);
      background: none; color: var(--sb-text); font: inherit; font-weight: 500; cursor: pointer; text-align: left;
    }
    .opcion:hover { background: var(--sb-surface); }
    .opcion sb-icon { font-size: 18px; color: var(--sb-primary-600); }
    @media (max-width: 767.98px) {
      .interior { padding-inline: var(--sb-space-4); justify-content: space-between; }
      .nav {
        position: fixed; inset: auto 0 0 0; z-index: 10; flex: none; justify-content: space-around;
        gap: 0; padding: var(--sb-space-2); background: var(--sb-bg); border-top: 1px solid var(--sb-border);
      }
      .enlace {
        flex: 1; flex-direction: column; gap: var(--sb-space-1); min-height: var(--sb-control-h);
        padding: var(--sb-space-1) var(--sb-space-2); border-radius: var(--sb-radius-control);
        color: var(--sb-text-muted); font-size: 12px; line-height: 16px;
      }
      .enlace sb-icon { display: inline-flex; font-size: 20px; }
      .enlace:hover { background: var(--sb-surface); }
      .enlace.activo { background: var(--sb-primary-100); color: var(--sb-primary-700); }
    }
  `,
})
export class SbHeaderComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Se emite al elegir «Cerrar sesión» en el menu del perfil; quien lo escucha cierra la sesion. */
  readonly cerrarSesionSolicitado = output<void>();
  protected readonly menuAbierto = signal(false);

  readonly rol = input<RolHeader>(null);
  readonly nombre = input<string>('');
  /** Si es true (por defecto) solo se muestran las secciones cuya ruta existe. */
  readonly soloRutasExistentes = input(true);

  protected alternarMenu(): void {
    this.menuAbierto.update((a) => !a);
  }

  protected cerrarSesion(): void {
    this.menuAbierto.set(false);
    this.cerrarSesionSolicitado.emit();
  }

  /** Clic fuera del encabezado: cierra el menu. */
  protected alClicGlobal(ev: Event): void {
    if (this.menuAbierto() && !this.host.nativeElement.contains(ev.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  /** Esc cierra el menu y devuelve el foco al boton del perfil. */
  protected alEscape(): void {
    if (this.menuAbierto()) {
      this.menuAbierto.set(false);
      this.host.nativeElement.querySelector('.avatar')?.focus();
    }
  }

  protected readonly inicial = computed(() => (this.nombre().trim().charAt(0) || '?').toUpperCase());

  protected readonly enlaces = computed<EnlaceNav[]>(() => {
    const rol = this.rol();
    const candidatos =
      rol === 'miembro' ? [ESPACIOS, MIS_RESERVAS] : rol === 'admin' ? [ESPACIOS] : [INICIAR_SESION];
    return this.soloRutasExistentes()
      ? candidatos.filter((e) => this.router.config.some((r) => r.path === e.ruta))
      : candidatos;
  });
}
