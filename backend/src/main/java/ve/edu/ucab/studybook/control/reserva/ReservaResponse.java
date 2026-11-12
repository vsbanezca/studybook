package ve.edu.ucab.studybook.control.reserva;

import ve.edu.ucab.studybook.model.Espacio;
import ve.edu.ucab.studybook.model.Reserva;

/** Reserva tal como la ve el cliente, con los datos del espacio. */
public record ReservaResponse(
		Long id,
		String codigo,
		Long espacioId,
		String espacioNombre,
		String ubicacion,
		String fecha,
		String horaInicio,
		String horaFin,
		int asistentes,
		String estado) {

	static ReservaResponse de(Reserva r, Espacio e) {
		return new ReservaResponse(r.id(), r.codigo(), r.espacioId(), e.nombre(), e.ubicacion(), r.fecha().toString(),
				r.horaInicio().toString(), r.horaFin().toString(), r.asistentes(), r.estado().name());
	}
}
