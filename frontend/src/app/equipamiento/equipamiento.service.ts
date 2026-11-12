import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Equipamiento } from './equipamiento.model';

@Injectable({ providedIn: 'root' })
export class EquipamientoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipamientos`;

  /** Equipamiento de un espacio. El servidor responde 404 si el espacio no existe. */
  consultarPorEspacio(espacioId: number): Observable<Equipamiento[]> {
    return this.http.get<Equipamiento[]>(this.apiUrl, { params: new HttpParams().set('espacioId', espacioId) });
  }

  /** Solo el Administrador puede crear (el servidor responde 403 a un Miembro). */
  crearEquipamiento(equipamiento: Equipamiento): Observable<Equipamiento> {
    return this.http.post<Equipamiento>(this.apiUrl, equipamiento);
  }
}
