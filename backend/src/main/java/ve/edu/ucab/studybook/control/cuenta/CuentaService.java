package ve.edu.ucab.studybook.control.cuenta;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.exceptions.NoAutorizadoException;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

@Service
public class CuentaService {

	public static final String CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos";

	// Textos de frontend/src/app/compartido/messages.ts
	static final String NOMBRE_OBLIGATORIO = "El nombre es obligatorio";
	static final String CEDULA_OBLIGATORIA = "La cédula es obligatoria";
	static final String CEDULA_FORMATO = "La cédula debe tener solo números";
	static final String CORREO_OBLIGATORIO = "El correo es obligatorio";
	static final String CORREO_FORMATO = "El correo debe tener formato de correo electrónico";
	static final String CORREO_NO_INSTITUCIONAL = "Usa tu correo institucional";
	static final String TELEFONO_OBLIGATORIO = "El teléfono es obligatorio";
	static final String TELEFONO_FORMATO = "El teléfono debe tener de 10 a 15 dígitos, con + opcional al inicio";
	static final String CLAVE_OBLIGATORIA = "La contraseña es obligatoria";
	static final String CLAVE_CORTA = "La contraseña debe tener al menos 8 caracteres";
	static final String CLAVE_LARGA = "La contraseña debe tener como máximo 72 caracteres";
	static final String CORREO_REGISTRADO = "Ya existe una cuenta con ese correo";
	static final String CEDULA_REGISTRADA = "Ya existe una cuenta con esa cédula";

	// SUPOSICION: formatos y largos a confirmar con el equipo y la profesora.
	private static final Pattern FORMATO_CORREO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final Pattern SOLO_DIGITOS = Pattern.compile("^\\d+$");
	private static final Pattern FORMATO_TELEFONO = Pattern.compile("^\\+?\\d{10,15}$");
	private static final int LARGO_MINIMO_CLAVE = 8;
	/** BCrypt solo usa los primeros 72 bytes: se rechaza una clave mas larga en vez de truncarla en silencio. */
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
			throw new NoAutorizadoException(CREDENCIALES_INCORRECTAS);
		}
		return cuenta;
	}

	/**
	 * Crea una cuenta de Miembro. El rol siempre es Miembro (no hay forma de pedir otro) y la clave se guarda
	 * cifrada. No inicia sesion. Devuelve la cuenta guardada: quien la use no debe exponer la clave.
	 */
	public Cuenta registrar(RegistroRequest peticion) {
		String nombre = obligatorio(peticion.nombre(), "nombre", NOMBRE_OBLIGATORIO);
		String cedula = obligatorio(peticion.cedula(), "cedula", CEDULA_OBLIGATORIA);
		if (!SOLO_DIGITOS.matcher(cedula).matches()) {
			throw new ValidacionException(CEDULA_FORMATO, "cedula");
		}
		String correo = obligatorio(peticion.correo(), "correo", CORREO_OBLIGATORIO).toLowerCase(Locale.ROOT);
		if (!FORMATO_CORREO.matcher(correo).matches()) {
			throw new ValidacionException(CORREO_FORMATO, "correo");
		}
		if (!esInstitucional(correo)) {
			throw new ValidacionException(CORREO_NO_INSTITUCIONAL, "correo");
		}
		String telefono = obligatorio(peticion.telefono(), "telefono", TELEFONO_OBLIGATORIO);
		if (!FORMATO_TELEFONO.matcher(telefono).matches()) {
			throw new ValidacionException(TELEFONO_FORMATO, "telefono");
		}
		String clave = peticion.clave();
		if (clave == null || clave.isEmpty()) {
			throw new ValidacionException(CLAVE_OBLIGATORIA, "clave");
		}
		if (clave.length() < LARGO_MINIMO_CLAVE) {
			throw new ValidacionException(CLAVE_CORTA, "clave");
		}
		if (clave.getBytes(StandardCharsets.UTF_8).length > BYTES_MAXIMOS_CLAVE) {
			throw new ValidacionException(CLAVE_LARGA, "clave");
		}

		Cuenta nueva = new Cuenta(null, nombre, cedula, correo, telefono, encoder.encode(clave), Rol.MIEMBRO);
		CuentaRepository.ResultadoGuardado resultado = repositorio.guardarSiEsUnica(nueva);
		if (resultado.duplicado() == CuentaRepository.Duplicado.CORREO) {
			throw new ValidacionException(CORREO_REGISTRADO);
		}
		if (resultado.duplicado() == CuentaRepository.Duplicado.CEDULA) {
			throw new ValidacionException(CEDULA_REGISTRADA);
		}
		return resultado.cuenta();
	}

	private boolean esInstitucional(String correo) {
		String dominio = correo.substring(correo.lastIndexOf('@') + 1);
		return dominiosPermitidos.contains(dominio);
	}

	private static String obligatorio(String valor, String campo, String mensaje) {
		if (valor == null || valor.isBlank()) {
			throw new ValidacionException(mensaje, campo);
		}
		return valor.trim();
	}
}
