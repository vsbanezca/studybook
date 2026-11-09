package ve.edu.ucab.studybook.exceptions;

/** Datos de entrada invalidos (HTTP 400). */
public class ValidacionException extends RuntimeException {

	public ValidacionException(String mensaje) {
		super(mensaje);
	}
}
