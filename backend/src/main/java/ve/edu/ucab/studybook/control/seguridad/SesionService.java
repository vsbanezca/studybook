package ve.edu.ucab.studybook.control.seguridad;

import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import ve.edu.ucab.studybook.control.cuenta.SesionResponse;
import ve.edu.ucab.studybook.exceptions.NoAutorizadoException;
import ve.edu.ucab.studybook.model.Cuenta;

/** Sesion del servidor (cookie JSESSIONID, HttpOnly). Guarda solo nombre, correo y rol. */
@Service
public class SesionService {

	private static final String ATRIBUTO = "sesionStudyBook";

	public void iniciar(HttpServletRequest request, Cuenta cuenta) {
		// Evita fijacion de sesion: si habia una, se descarta y se crea una nueva.
		HttpSession anterior = request.getSession(false);
		if (anterior != null) {
			anterior.invalidate();
		}
		request.getSession(true).setAttribute(ATRIBUTO,
				new SesionResponse(cuenta.nombre(), cuenta.correo(), cuenta.rol()));
	}

	public SesionResponse actual(HttpServletRequest request) {
		HttpSession sesion = request.getSession(false);
		Object valor = sesion == null ? null : sesion.getAttribute(ATRIBUTO);
		if (valor instanceof SesionResponse datos) {
			return datos;
		}
		throw new NoAutorizadoException("Debes iniciar sesión");
	}
}
