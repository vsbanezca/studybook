import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Equipamiento } from './equipamiento.model';

@Injectable({ providedIn: 'root' })
export class EquipamientoService {
  private readonly api = inject(ApiService);

  /** Equipamiento de un espacio. El servidor responde 404 si el espacio no existe. */
  consultarPorEspacio(espacioId: number): Observable<Equipamiento[]> {
    return this.api.get<Equipamiento[]>('/equipamientos', { espacioId });
  }

  /** Solo el Administrador puede crear (el servidor responde 403 a un Miembro). */
  crearEquipamiento(equipamiento: Equipamiento): Observable<Equipamiento> {
    return this.api.post<Equipamiento>('/equipamientos', equipamiento);
  }
}
