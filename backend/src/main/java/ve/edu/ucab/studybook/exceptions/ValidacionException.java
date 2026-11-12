package ve.edu.ucab.studybook.exceptions;

/** Datos de entrada invalidos (HTTP 400). Opcionalmente indica el campo con error. */
public class ValidacionException extends RuntimeException {

	private final String campo;
	private final boolean mensajeLiteral;

	public ValidacionException(String mensaje) {
		this(mensaje, null);
	}

	public ValidacionException(String mensaje, String campo) {
		this(mensaje, campo, false);
	}

	private ValidacionException(String mensaje, String campo, boolean mensajeLiteral) {
		super(mensaje);
		this.campo = campo;
		this.mensajeLiteral = mensajeLiteral;
	}

	/** El mensaje se devuelve tal cual como texto principal, ademas de indicar el campo. */
	public static ValidacionException literal(String mensaje, String campo) {
		return new ValidacionException(mensaje, campo, true);
	}

	public String getCampo() {
		return campo;
	}

	public boolean esMensajeLiteral() {
		return mensajeLiteral;
	}
}
