package ve.edu.ucab.studybook.control.cuenta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

public record LoginRequest(
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		@Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = CodigosValidacion.FORMATO)
		String correo,
		@NotBlank(message = CodigosValidacion.OBLIGATORIO)
		String clave) {
}
