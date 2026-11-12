package ve.edu.ucab.studybook.exceptions;

/** El recurso pedido no existe (HTTP 404). */
public class NoEncontradoException extends RuntimeException {

	public NoEncontradoException(String mensaje) {
		super(mensaje);
	}
}
