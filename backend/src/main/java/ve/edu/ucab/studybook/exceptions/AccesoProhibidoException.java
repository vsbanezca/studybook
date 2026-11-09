package ve.edu.ucab.studybook.exceptions;

/** Hay sesion pero el rol no tiene permiso para la funcion (HTTP 403). */
public class AccesoProhibidoException extends RuntimeException {

	public AccesoProhibidoException(String mensaje) {
		super(mensaje);
	}
}
