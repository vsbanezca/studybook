package ve.edu.ucab.studybook.exceptions;

/** Datos de entrada invalidos (HTTP 400). Opcionalmente indica el campo con error. */
public class ValidacionException extends RuntimeException {

	private final String campo;

	public ValidacionException(String mensaje) {
		this(mensaje, null);
	}

	public ValidacionException(String mensaje, String campo) {
		super(mensaje);
		this.campo = campo;
	}

	public String getCampo() {
		return campo;
	}
}
