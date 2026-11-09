package ve.edu.ucab.studybook.model;

/**
 * Cuenta de usuario. La clave se guarda siempre cifrada (BCrypt) y nunca se devuelve por la API.
 */
public record Cuenta(
		Long id,
		String nombre,
		String cedula,
		String correo,
		String telefono,
		String clave,
		Rol rol) {

	public Cuenta conId(Long nuevoId) {
		return new Cuenta(nuevoId, nombre, cedula, correo, telefono, clave, rol);
	}
}
