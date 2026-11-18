package ve.edu.ucab.studybook.control.cuenta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import ve.edu.ucab.studybook.control.comun.TelefonoValido;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

/**
 * Datos del formulario Registrarse. No tiene campo "rol": cualquier rol que llegue en la peticion se ignora,
 * porque toda cuenta registrada por esta via es Miembro.
 * El formato se valida en el frontend; estas anotaciones son la red de seguridad para quien llame a la API sin
 * la pantalla (responden 400 con el campo y un codigo). El dominio institucional y los duplicados se deciden en
 * CuentaService.registrar.
 */
public record RegistroRequest(
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		String nombre,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^\\s*\\d+\\s*$", message = CodigosValidacion.FORMATO)
		String cedula,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*$", message = CodigosValidacion.FORMATO)
		String correo,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@TelefonoValido
		String telefono,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Size(min = 8, message = CodigosValidacion.LONGITUD_MINIMA)
		String clave) {
}
