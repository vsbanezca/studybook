package ve.edu.ucab.studybook.exceptions;

/**
 * Codigos estables que el servidor responde en el campo "campos" de un 400 de validacion. Los mensajes amigables
 * viven en el frontend (frontend/src/app/compartido/validacion/validation-messages.ts): el servidor solo dice
 * que campo fallo y por que, sin texto repetido. Las anotaciones de Bean Validation usan estas constantes.
 */
public final class CodigosValidacion {

	public static final String OBLIGATORIO = "obligatorio";
	public static final String FORMATO = "formato";
	public static final String MINIMO = "minimo";
	public static final String LONGITUD_MINIMA = "longitud_minima";
	public static final String LONGITUD_MAXIMA = "longitud_maxima";
	public static final String DOMINIO_NO_INSTITUCIONAL = "dominio_no_institucional";
	public static final String FECHA_PASADA = "fecha_pasada";
	public static final String HORA_INICIO_PASADA = "hora_inicio_pasada";
	public static final String FIN_NO_POSTERIOR = "fin_no_posterior";

	private CodigosValidacion() {
	}
}
