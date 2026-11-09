package ve.edu.ucab.studybook.exceptions;

/** Falta la sesion o las credenciales no son validas (HTTP 401). */
public class NoAutorizadoException extends RuntimeException {

	public NoAutorizadoException(String mensaje) {
		super(mensaje);
	}
}
