package ve.edu.ucab.studybook.control.cuenta;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.exceptions.NoAutorizadoException;
import ve.edu.ucab.studybook.model.Cuenta;

@Service
public class CuentaService {

	public static final String CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

	private final CuentaRepository repositorio;
	private final PasswordEncoder encoder;
	/** Hash de relleno: se compara aunque el correo no exista para que el tiempo de respuesta sea similar. */
	private final String hashRelleno;

	public CuentaService(CuentaRepository repositorio, PasswordEncoder encoder) {
		this.repositorio = repositorio;
		this.encoder = encoder;
		this.hashRelleno = encoder.encode("relleno-sin-uso");
	}

	/** Misma excepcion para correo inexistente y clave incorrecta: no se revela cual fallo. */
	public Cuenta autenticar(String correo, String clave) {
		Cuenta cuenta = repositorio.buscarPorCorreo(correo.trim()).orElse(null);
		boolean coincide = encoder.matches(clave, cuenta != null ? cuenta.clave() : hashRelleno);
		if (cuenta == null || !coincide) {
			throw new NoAutorizadoException(CREDENCIALES_INCORRECTAS);
		}
		return cuenta;
	}
}
