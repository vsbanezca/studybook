package ve.edu.ucab.studybook.control.seguridad;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.control.cuenta.CuentaRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

/** Miembro de prueba, solo en el perfil "dev" (mientras no exista la historia Registrarse). */
@Component
@Profile("dev")
public class CargaMiembroPrueba implements ApplicationRunner {

	private final CuentaRepository repositorio;
	private final PasswordEncoder encoder;
	private final String correo;
	private final String clave;

	public CargaMiembroPrueba(CuentaRepository repositorio, PasswordEncoder encoder,
			@Value("${studybook.miembro-prueba.correo}") String correo,
			@Value("${studybook.miembro-prueba.clave}") String clave) {
		this.repositorio = repositorio;
		this.encoder = encoder;
		this.correo = correo;
		this.clave = clave;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (repositorio.buscarPorCorreo(correo).isEmpty()) {
			repositorio.guardar(new Cuenta(null, "Miembro de prueba", "V-00000000", correo, "0000-0000000",
					encoder.encode(clave), Rol.MIEMBRO));
		}
	}
}
