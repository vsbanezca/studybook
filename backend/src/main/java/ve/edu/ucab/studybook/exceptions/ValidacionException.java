package ve.edu.ucab.studybook.exceptions;

/**
 * Datos de entrada invalidos (HTTP 400). Lleva un codigo de CodigosValidacion (nunca un texto para el usuario) y,
 * opcionalmente, el campo con error.
 */
public class ValidacionException extends RuntimeException {

	private final String campo;
	private final boolean deRegla;

	public ValidacionException(String codigo, String campo) {
		this(codigo, campo, false);
	}

	private ValidacionException(String codigo, String campo, boolean deRegla) {
		super(codigo);
		this.campo = campo;
		this.deRegla = deRegla;
	}

	/**
	 * Rechazo por una regla de negocio (por ejemplo, un dato repetido o la capacidad excedida): el codigo va como
	 * "mensaje" general, ademas de indicar el campo, para que el frontend lo use como titulo.
	 */
	public static ValidacionException deRegla(String codigo, String campo) {
		return new ValidacionException(codigo, campo, true);
	}

	public String getCodigo() {
		return getMessage();
	}

	public String getCampo() {
		return campo;
	}

	public boolean esDeRegla() {
		return deRegla;
	}
}
