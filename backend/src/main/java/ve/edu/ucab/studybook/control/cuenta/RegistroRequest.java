package ve.edu.ucab.studybook.control.cuenta;

/**
 * Datos del formulario Registrarse. No tiene campo "rol": cualquier rol que llegue en la peticion se ignora,
 * porque toda cuenta registrada por esta via es Miembro. Las validaciones estan en CuentaService.registrar.
 */
public record RegistroRequest(
		String nombre,
		String cedula,
		String correo,
		String telefono,
		String clave) {
}
