package ve.edu.ucab.studybook.control.comun;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

/** Bean Validation: el telefono, una vez normalizado (sin espacios, guiones ni parentesis), cumple el formato. */
@Documented
@Constraint(validatedBy = TelefonoValido.Validador.class)
@Target({ ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface TelefonoValido {

	String message() default CodigosValidacion.FORMATO;

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	/** Un valor nulo o vacio lo reporta @NotBlank. */
	class Validador implements ConstraintValidator<TelefonoValido, String> {

		@Override
		public boolean isValid(String valor, ConstraintValidatorContext contexto) {
			return valor == null || valor.isBlank() || Telefono.esValido(valor);
		}
	}
}
