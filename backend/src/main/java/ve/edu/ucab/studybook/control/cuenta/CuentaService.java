package ve.edu.ucab.studybook.control.cuenta;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.control.comun.Telefono;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;
import ve.edu.ucab.studybook.exceptions.NoAutorizadoException;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

@Service
public class CuentaService {

	/** BCrypt solo usa los primeros 72 bytes: se rechaza una clave mas larga en vez de truncarla en silencio (seguridad). */
	private static final int BYTES_MAXIMOS_CLAVE = 72;

	private final CuentaRepository repositorio;
	private final PasswordEncoder encoder;
	private final List<String> dominiosPermitidos;
	/** Hash de relleno: se compara aunque el correo no exista para que el tiempo de respuesta sea similar. */
	private final String hashRelleno;

	public CuentaService(CuentaRepository repositorio, PasswordEncoder encoder,
			@Value("${studybook.registro.dominios}") List<String> dominiosPermitidos) {
		this.repositorio = repositorio;
		this.encoder = encoder;
		this.dominiosPermitidos = dominiosPermitidos.stream().map(d -> d.trim().toLowerCase(Locale.ROOT)).toList();
		this.hashRelleno = encoder.encode("relleno-sin-uso");
	}

	/** Misma excepcion para correo inexistente y clave incorrecta: no se revela cual fallo. */
	public Cuenta autenticar(String correo, String clave) {
		Cuenta cuenta = repositorio.buscarPorCorreo(correo.trim()).orElse(null);
		boolean coincide = encoder.matches(clave, cuenta != null ? cuenta.clave() : hashRelleno);
		if (cuenta == null || !coincide) {
			throw new NoAutorizadoException(CodigosValidacion.CREDENCIALES_INCORRECTAS);
		}
		return cuenta;
	}

	/**
	 * Crea una cuenta de Miembro. El rol siempre es Miembro (no hay forma de pedir otro) y la clave se guarda
	 * cifrada. No inicia sesion. Devuelve la cuenta guardada: quien la use no debe exponer la clave.
	 */
	public Cuenta registrar(RegistroRequest peticion) {
		// El formato lo valida Bean Validation en RegistroRequest (red de seguridad); aqui solo quedan las reglas de
		// acceso y de lo guardado: dominio institucional, largo seguro para BCrypt y duplicados.
		String correo = peticion.correo().trim().toLowerCase(Locale.ROOT);
		if (!esInstitucional(correo)) {
			throw new ValidacionException(CodigosValidacion.DOMINIO_NO_INSTITUCIONAL, "correo");
		}
		String clave = peticion.clave();
		if (clave.getBytes(StandardCharsets.UTF_8).length > BYTES_MAXIMOS_CLAVE) {
			throw new ValidacionException(CodigosValidacion.LONGITUD_MAXIMA, "clave");
		}

		Cuenta nueva = new Cuenta(null, peticion.nombre().trim(), peticion.cedula().trim(), correo,
				Telefono.normalizar(peticion.telefono()), encoder.encode(clave), Rol.MIEMBRO);
		CuentaRepository.ResultadoGuardado resultado = repositorio.guardarSiEsUnica(nueva);
		if (resultado.duplicado() == CuentaRepository.Duplicado.CORREO) {
			throw ValidacionException.deRegla(CodigosValidacion.CORREO_REGISTRADO, "correo");
		}
		if (resultado.duplicado() == CuentaRepository.Duplicado.CEDULA) {
			throw ValidacionException.deRegla(CodigosValidacion.CEDULA_REGISTRADA, "cedula");
		}
		return resultado.cuenta();
	}

	private boolean esInstitucional(String correo) {
		String dominio = correo.substring(correo.lastIndexOf('@') + 1);
		return dominiosPermitidos.contains(dominio);
	}
}
