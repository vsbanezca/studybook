package ve.edu.ucab.studybook.control.reserva;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.exceptions.ValidacionException;

/** Reglas de los datos que ingresa el miembro. Cada rechazo indica el campo. */
@Component
public class ReservaValidador {

	// Textos de frontend/src/app/compartido/messages.ts
	static final String CAMPO_OBLIGATORIO = "Este campo es obligatorio.";
	static final String FECHA_INVALIDA = "La fecha no es válida";
	static final String FECHA_PASADA = "La fecha no puede estar en el pasado";
	static final String HORA_INICIO_PASADA = "La hora de inicio no puede ser anterior a la hora actual";
	static final String HORA_INVALIDA = "La hora no es válida";
	static final String FIN_NO_POSTERIOR = "La hora de fin debe ser posterior a la hora de inicio";
	static final String ASISTENTES_INVALIDOS = "Los asistentes deben ser un número entero mayor o igual a 1";

	/** Datos ya convertidos a sus tipos. */
	public record Datos(Long espacioId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin, int asistentes) {
	}

	public Datos validar(ReservaRequest r, LocalDateTime ahora) {
		LocalDate hoy = ahora.toLocalDate();
		if (r.espacioId() == null) {
			throw new ValidacionException(CAMPO_OBLIGATORIO, "espacioId");
		}
		String fechaTexto = obligatorio(r.fecha(), "fecha");
		String inicioTexto = obligatorio(r.horaInicio(), "horaInicio");
		String finTexto = obligatorio(r.horaFin(), "horaFin");
		String asistentesTexto = obligatorio(r.asistentes(), "asistentes");

		LocalDate fecha;
		try {
			fecha = LocalDate.parse(fechaTexto);
		}
		catch (DateTimeParseException e) {
			throw new ValidacionException(FECHA_INVALIDA, "fecha");
		}
		if (fecha.isBefore(hoy)) {
			throw new ValidacionException(FECHA_PASADA, "fecha");
		}
		LocalTime inicio = hora(inicioTexto, "horaInicio");
		// Si la fecha es hoy, la hora de inicio no puede ser anterior a la actual. La comparacion es por minuto:
		// una hora de inicio igual a la hora actual (HH:mm) se acepta. Decide el servidor, no el navegador.
		if (fecha.equals(hoy) && inicio.isBefore(ahora.toLocalTime().truncatedTo(ChronoUnit.MINUTES))) {
			throw new ValidacionException(HORA_INICIO_PASADA, "horaInicio");
		}
		LocalTime fin = hora(finTexto, "horaFin");
		if (!fin.isAfter(inicio)) {
			throw new ValidacionException(FIN_NO_POSTERIOR, "horaFin");
		}
		int asistentes;
		try {
			asistentes = Integer.parseInt(asistentesTexto);
		}
		catch (NumberFormatException e) {
			throw new ValidacionException(ASISTENTES_INVALIDOS, "asistentes");
		}
		if (asistentes < 1) {
			throw new ValidacionException(ASISTENTES_INVALIDOS, "asistentes");
		}
		return new Datos(r.espacioId(), fecha, inicio, fin, asistentes);
	}

	private static LocalTime hora(String texto, String campo) {
		try {
			return LocalTime.parse(texto);
		}
		catch (DateTimeParseException e) {
			throw new ValidacionException(HORA_INVALIDA, campo);
		}
	}

	private static String obligatorio(String valor, String campo) {
		if (valor == null || valor.isBlank()) {
			throw new ValidacionException(CAMPO_OBLIGATORIO, campo);
		}
		return valor.trim();
	}
}
