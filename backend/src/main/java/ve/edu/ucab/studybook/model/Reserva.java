package ve.edu.ucab.studybook.model;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Reserva de un espacio. El miembro es el correo de la cuenta con sesion (nunca viene del cliente)
 * y el codigo lo genera el sistema a partir del id.
 */
public record Reserva(
		Long id,
		String codigo,
		String miembro,
		Long espacioId,
		LocalDate fecha,
		LocalTime horaInicio,
		LocalTime horaFin,
		int asistentes,
		EstadoReserva estado) {

	public Reserva conId(Long nuevoId) {
		return new Reserva(nuevoId, "RES-%06d".formatted(nuevoId), miembro, espacioId, fecha, horaInicio, horaFin,
				asistentes, estado);
	}

	/** Dos reservas se solapan si una empieza antes de que termine la otra; las contiguas (fin = inicio) no chocan. */
	public boolean seSolapaCon(LocalDate otraFecha, LocalTime otroInicio, LocalTime otroFin) {
		return fecha.equals(otraFecha) && horaInicio.isBefore(otroFin) && horaFin.isAfter(otroInicio);
	}
}
