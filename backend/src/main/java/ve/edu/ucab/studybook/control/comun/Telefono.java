package ve.edu.ucab.studybook.control.comun;

import java.util.regex.Pattern;

/**
 * Regla de telefono compartida (Registrarse y, mas adelante, Modificar mi cuenta).
 * Se quitan espacios, guiones y parentesis y despues se exige: + opcional al inicio y de 10 a 15 digitos.
 * El frontend tiene la misma regla en frontend/src/app/compartido/telefono.ts.
 * SUPOSICION: el formato (10 a 15 digitos) se confirma con el equipo y la profesora.
 */
public final class Telefono {

	public static final String MENSAJE_FORMATO = "El teléfono debe tener de 10 a 15 dígitos, con + opcional al inicio";

	private static final Pattern SEPARADORES = Pattern.compile("[\\s\\-()]");
	private static final Pattern FORMATO = Pattern.compile("^\\+?\\d{10,15}$");

	private Telefono() {
	}

	/** Quita espacios, guiones y parentesis. No valida nada. */
	public static String normalizar(String valor) {
		return valor == null ? "" : SEPARADORES.matcher(valor).replaceAll("");
	}

	/** Verdadero si el valor, una vez normalizado, cumple el formato. */
	public static boolean esValido(String valor) {
		return FORMATO.matcher(normalizar(valor)).matches();
	}
}
