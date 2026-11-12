package ve.edu.ucab.studybook.control.reserva;

/**
 * Datos que ingresa el miembro. Todo llega como texto y se valida en ReservaValidador, para poder
 * indicar el campo con error (no hay miembro, codigo ni estado: los asigna el sistema).
 */
public record ReservaRequest(
		Long espacioId,
		String fecha,
		String horaInicio,
		String horaFin,
		String asistentes) {
}
