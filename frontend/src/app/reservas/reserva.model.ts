export type EstadoReservaApi = 'ACTIVA' | 'CANCELADA';

/** Reserva tal como la devuelve el servidor (POST /api/reservas y GET /api/reservas/mias). */
export interface Reserva {
  id: number;
  /** Codigo unico que genera el sistema, por ejemplo RES-000001. */
  codigo: string;
  espacioId: number;
  espacioNombre: string;
  ubicacion: string;
  /** AAAA-MM-DD */
  fecha: string;
  /** HH:mm */
  horaInicio: string;
  horaFin: string;
  asistentes: number;
  estado: EstadoReservaApi;
}

/** Datos que ingresa el miembro. El miembro, el codigo y el estado los asigna el servidor. */
export interface SolicitudReserva {
  espacioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes: number;
}
