package ve.edu.ucab.studybook.exceptions;

/** La peticion es valida pero choca con el estado actual, por ejemplo un horario ya reservado (HTTP 409). */
public class ConflictoException extends RuntimeException {

	private final String campo;

	public ConflictoException(String mensaje, String campo) {
		super(mensaje);
		this.campo = campo;
	}

	public String getCampo() {
		return campo;
	}
}
