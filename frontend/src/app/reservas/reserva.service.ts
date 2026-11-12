import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from './reserva.model';

export type { Reserva } from './reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private readonly http = inject(HttpClient);

  /** Reservas de la cuenta con sesion abierta. El servidor las filtra por la sesion. */
  listarMisReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas/mias');
  }
}
