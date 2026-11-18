package ve.edu.ucab.studybook.control.reserva;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.exceptions.CodigosValidacion;
import ve.edu.ucab.studybook.exceptions.ValidacionException;

/**
 * Reglas de los datos de la reserva que el servidor no delega en el frontend: las que dependen de su reloj (fecha y
 * hora de inicio pasadas) y la coherencia de las horas, que protege lo guardado. El formato (obligatorio, fecha y
 * hora con forma valida, asistentes entero desde 1) lo valida Bean Validation en ReservaRequest. Cada rechazo
 * indica el campo y un codigo; los textos viven en el frontend.
 */
@Component
public class ReservaValidador {

	/** Datos ya convertidos a sus tipos. */
	public record Datos(Long espacioId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin, int asistentes) {
	}

	public Datos validar(ReservaRequest r, LocalDateTime ahora) {
		LocalDate hoy = ahora.toLocalDate();
		LocalDate fecha = fecha(r.fecha());
		if (fecha.isBefore(hoy)) {
			throw new ValidacionException(CodigosValidacion.FECHA_PASADA, "fecha");
		}
		LocalTime inicio = hora(r.horaInicio(), "horaInicio");
		// Si la fecha es hoy, la hora de inicio no puede ser anterior a la actual. La comparacion es por minuto:
		// una hora de inicio igual a la hora actual (HH:mm) se acepta. Decide el servidor, no el navegador.
		if (fecha.equals(hoy) && inicio.isBefore(ahora.toLocalTime().truncatedTo(ChronoUnit.MINUTES))) {
			throw new ValidacionException(CodigosValidacion.HORA_INICIO_PASADA, "horaInicio");
		}
		LocalTime fin = hora(r.horaFin(), "horaFin");
		if (!fin.isAfter(inicio)) {
			throw new ValidacionException(CodigosValidacion.FIN_NO_POSTERIOR, "horaFin");
		}
		return new Datos(r.espacioId(), fecha, inicio, fin, r.asistentes());
	}

	// La forma ya la reviso Bean Validation; esto solo convierte y atrapa fechas imposibles como 2026-02-31.
	private static LocalDate fecha(String texto) {
		try {
			return LocalDate.parse(texto);
		}
		catch (DateTimeParseException e) {
			throw new ValidacionException(CodigosValidacion.FORMATO, "fecha");
		}
	}

	private static LocalTime hora(String texto, String campo) {
		try {
			return LocalTime.parse(texto);
		}
		catch (DateTimeParseException e) {
			throw new ValidacionException(CodigosValidacion.FORMATO, campo);
		}
	}
}
