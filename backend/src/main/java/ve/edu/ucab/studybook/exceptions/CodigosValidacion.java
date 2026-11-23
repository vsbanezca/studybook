package ve.edu.ucab.studybook.exceptions;

/**
 * Codigos estables que el servidor responde en un error, en "mensaje" (el codigo general) y en "campos" (el codigo
 * de cada campo). El servidor nunca redacta textos para el usuario: los textos viven solo en el frontend
 * (frontend/src/app/compartido/messages.ts) y los elige frontend/src/app/compartido/validacion/validation-messages.ts.
 * Las anotaciones de Bean Validation, los servicios y el interceptor de autorizacion usan estas constantes.
 */
public final class CodigosValidacion {

	// ----- Generales (van en "mensaje") -----
	public static final String DATOS_INVALIDOS = "datos_invalidos";
	public static final String SIN_PERMISO = "sin_permiso";
	public static final String SESION_REQUERIDA = "sesion_requerida";
	public static final String CREDENCIALES_INCORRECTAS = "credenciales_incorrectas";

	// ----- Formato (Bean Validation y reglas del reloj del servidor) -----
	public static final String OBLIGATORIO = "obligatorio";
	public static final String FORMATO = "formato";
	public static final String MINIMO = "minimo";
	public static final String LONGITUD_MINIMA = "longitud_minima";
	public static final String LONGITUD_MAXIMA = "longitud_maxima";
	public static final String DOMINIO_NO_INSTITUCIONAL = "dominio_no_institucional";
	public static final String FECHA_PASADA = "fecha_pasada";
	public static final String HORA_INICIO_PASADA = "hora_inicio_pasada";
	public static final String FIN_NO_POSTERIOR = "fin_no_posterior";

	// ----- Reglas de negocio (dependen de lo guardado) -----
	public static final String CORREO_REGISTRADO = "correo_registrado";
	public static final String CEDULA_REGISTRADA = "cedula_registrada";
	public static final String ESPACIO_REPETIDO = "espacio_repetido";
	public static final String ESPACIO_NO_EXISTE = "espacio_no_existe";
	public static final String EQUIPAMIENTO_REPETIDO = "equipamiento_repetido";
	public static final String CAPACIDAD_EXCEDIDA = "capacidad_excedida";
	public static final String NO_DISPONIBLE = "no_disponible";

	private CodigosValidacion() {
	}
}
