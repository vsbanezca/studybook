package ve.edu.ucab.studybook.control.seguridad;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ve.edu.ucab.studybook.control.cuenta.SesionResponse;
import ve.edu.ucab.studybook.exceptions.AccesoProhibidoException;
import ve.edu.ucab.studybook.exceptions.GlobalExceptionHandler;
import ve.edu.ucab.studybook.model.Rol;

/**
 * Autorizacion por rol en el servidor. Es la que decide, aunque el cliente oculte opciones.
 * - POST /api/auth/login y POST /api/auth/registro: publicos (no exigen sesion).
 * - /api/admin/**: solo ADMINISTRADOR (403 para MIEMBRO).
 * - /api/espacios/** y /api/equipamientos/**: consultar (GET) para cualquier sesion; crear, modificar o eliminar solo ADMINISTRADOR.
 * - resto de /api/**: cualquier sesion valida (401 si no hay).
 */
@Component
public class AutorizacionInterceptor implements HandlerInterceptor {

	private final SesionService sesiones;

	public AutorizacionInterceptor(SesionService sesiones) {
		this.sesiones = sesiones;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		String ruta = request.getRequestURI();
		if (esPublica(ruta, request.getMethod())) {
			return true;
		}
		SesionResponse sesion = sesiones.actual(request);
		if (exigeAdministrador(ruta, request.getMethod()) && sesion.rol() != Rol.ADMINISTRADOR) {
			throw new AccesoProhibidoException(GlobalExceptionHandler.SIN_PERMISO);
		}
		return true;
	}

	/** Rutas que se pueden usar sin sesion: iniciar sesion y registrarse (solo POST). */
	private static boolean esPublica(String ruta, String metodo) {
		if ("OPTIONS".equals(metodo)) {
			return true;
		}
		boolean esPost = "POST".equals(metodo);
		return esPost && (ruta.equals("/api/auth/login") || ruta.equals("/api/auth/registro"));
	}

	private static boolean exigeAdministrador(String ruta, String metodo) {
		if (ruta.startsWith("/api/admin/")) {
			return true;
		}
		boolean esRecursoDeAdministracion = esRuta(ruta, "/api/espacios") || esRuta(ruta, "/api/equipamientos");
		boolean soloLectura = "GET".equals(metodo) || "HEAD".equals(metodo);
		return esRecursoDeAdministracion && !soloLectura;
	}

	private static boolean esRuta(String ruta, String base) {
		return ruta.equals(base) || ruta.startsWith(base + "/");
	}
}
