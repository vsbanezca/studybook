export type EstadoReservaApi = 'ACTIVA' | 'CANCELADA';

/**
 * Reserva tal como la devuelve GET /api/reservas/mias.
 * SUPOSICION: los campos y el formato de fecha (AAAA-MM-DD) y hora (HH:mm) se confirman cuando exista el backend de reservas.
 */
export interface Reserva {
  id: number;
  espacioNombre: string;
  ubicacion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  asistentes: number;
  estado: EstadoReservaApi;
}
