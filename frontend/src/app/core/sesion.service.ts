import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Sesion } from '../cuenta/cuenta.model';
import { CuentaService } from '../cuenta/cuenta.service';
import { RolHeader } from '../compartido/ui/sb-header/sb-header.component';

/** Estado de la sesion en el cliente. Solo refleja lo que decide el servidor. */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly cuentas = inject(CuentaService);
  private readonly _usuario = signal<Sesion | null>(null);

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly esAdmin = computed(() => this._usuario()?.rol === 'ADMINISTRADOR');
  readonly rolHeader = computed<RolHeader>(() => {
    const rol = this._usuario()?.rol;
    return rol === 'ADMINISTRADOR' ? 'admin' : rol === 'MIEMBRO' ? 'miembro' : null;
  });

  establecer(sesion: Sesion): void {
    this._usuario.set(sesion);
  }

  limpiar(): void {
    this._usuario.set(null);
  }

  /** Al arrancar la app: recupera la sesion si el servidor todavia la tiene. */
  async restaurar(): Promise<void> {
    try {
      this._usuario.set(await firstValueFrom(this.cuentas.sesionActual()));
    } catch {
      this._usuario.set(null);
    }
  }
}
