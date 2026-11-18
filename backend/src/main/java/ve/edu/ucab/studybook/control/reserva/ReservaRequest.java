package ve.edu.ucab.studybook.control.reserva;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

/**
 * Datos que ingresa el miembro (no hay miembro, codigo ni estado: los asigna el sistema).
 * El formato lo valida el frontend; estas anotaciones son la red de seguridad para quien llame a la API sin la
 * pantalla (400 con el campo y un codigo). Las reglas que dependen del reloj del servidor, la coherencia entre
 * horas, la capacidad y la disponibilidad se aplican en ReservaValidador y ReservaService.
 */
public record ReservaRequest(
		@NotNull(message = CodigosValidacion.OBLIGATORIO)
		Long espacioId,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = CodigosValidacion.FORMATO)
		String fecha,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = CodigosValidacion.FORMATO)
		String horaInicio,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = CodigosValidacion.FORMATO)
		String horaFin,
		@NotNull(message = CodigosValidacion.OBLIGATORIO)
		@Min(value = 1, message = CodigosValidacion.MINIMO)
		Integer asistentes) {
}
