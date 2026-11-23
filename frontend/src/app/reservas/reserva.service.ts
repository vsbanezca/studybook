import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Reserva, SolicitudReserva } from './reserva.model';

export type { Reserva, SolicitudReserva } from './reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly api = inject(ApiService);

  /** Reservas de la cuenta con sesion abierta. El servidor las filtra por la sesion. */
  listarMisReservas(): Observable<Reserva[]> {
    return this.api.get<Reserva[]>('/reservas/mias');
  }

  /** Aplica las reglas de validacion, capacidad y disponibilidad sin guardar nada. */
  validarReserva(solicitud: SolicitudReserva): Observable<unknown> {
    return this.api.post<unknown>('/reservas/validar', solicitud);
  }

  /** Tras el «Si» del miembro: el servidor revalida todo y registra. */
  crearReserva(solicitud: SolicitudReserva): Observable<Reserva> {
    return this.api.post<Reserva>('/reservas', solicitud);
  }
}
