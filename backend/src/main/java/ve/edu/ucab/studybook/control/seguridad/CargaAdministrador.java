package ve.edu.ucab.studybook.control.seguridad;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.control.cuenta.CuentaRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

/**
 * Precarga la cuenta de Administrador al arrancar, si todavia no existe ninguna.
 * Correo y clave vienen de configuracion (STUDYBOOK_ADMIN_CORREO, STUDYBOOK_ADMIN_CLAVE), no del codigo.
 */
@Component
public class CargaAdministrador implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(CargaAdministrador.class);

	private final CuentaRepository repositorio;
	private final PasswordEncoder encoder;
	private final String correo;
	private final String clave;
	private final String nombre;
	private final String cedula;

	public CargaAdministrador(CuentaRepository repositorio, PasswordEncoder encoder,
			@Value("${studybook.admin.correo:}") String correo,
			@Value("${studybook.admin.clave:}") String clave,
			@Value("${studybook.admin.nombre:Administrador}") String nombre,
			@Value("${studybook.admin.cedula:}") String cedula) {
		this.repositorio = repositorio;
		this.encoder = encoder;
		this.correo = correo;
		this.clave = clave;
		this.nombre = nombre;
		this.cedula = cedula;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (repositorio.existeRol(Rol.ADMINISTRADOR)) {
			return;
		}
		if (correo.isBlank() || clave.isBlank()) {
			log.warn("No hay cuenta de Administrador: defina STUDYBOOK_ADMIN_CORREO y STUDYBOOK_ADMIN_CLAVE.");
			return;
		}
		repositorio.guardar(new Cuenta(null, nombre, cedula, correo, "", encoder.encode(clave), Rol.ADMINISTRADOR));
		log.info("Cuenta de Administrador creada ({}).", correo);
	}
}
