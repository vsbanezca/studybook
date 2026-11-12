import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva, SolicitudReserva } from './reserva.model';

export type { Reserva, SolicitudReserva } from './reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly http = inject(HttpClient);

  /** Reservas de la cuenta con sesion abierta. El servidor las filtra por la sesion. */
  listarMisReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas/mias');
  }

  /** Aplica las reglas de validacion, capacidad y disponibilidad sin guardar nada. */
  validarReserva(solicitud: SolicitudReserva): Observable<unknown> {
    return this.http.post('/api/reservas/validar', solicitud);
  }

  /** Tras el «Si» del miembro: el servidor revalida todo y registra. */
  crearReserva(solicitud: SolicitudReserva): Observable<Reserva> {
    return this.http.post<Reserva>('/api/reservas', solicitud);
  }
}
