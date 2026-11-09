package ve.edu.ucab.studybook.control.cuenta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(
		@NotBlank(message = "El correo es obligatorio")
		@Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "El correo debe tener formato de correo electrónico")
		String correo,
		@NotBlank(message = "La contraseña es obligatoria")
		String clave) {
}
