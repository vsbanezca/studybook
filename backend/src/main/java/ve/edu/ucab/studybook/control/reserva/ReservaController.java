package ve.edu.ucab.studybook.control.reserva;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import ve.edu.ucab.studybook.control.seguridad.SesionService;

/** Solo el Miembro usa estas rutas (el AutorizacionInterceptor responde 403 al Administrador). */
@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

	private final ReservaService servicio;
	private final SesionService sesiones;

	public ReservaController(ReservaService servicio, SesionService sesiones) {
		this.servicio = servicio;
		this.sesiones = sesiones;
	}

	/** Aplica las reglas de validacion, capacidad y disponibilidad. No guarda nada. */
	@PostMapping("/validar")
	public Map<String, Boolean> validar(@RequestBody ReservaRequest peticion) {
		servicio.validar(peticion);
		return Map.of("valida", true);
	}

	/** Tras el «Si» del miembro: revalida todo y registra. El miembro sale de la sesion, nunca del cuerpo. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ReservaResponse crear(@RequestBody ReservaRequest peticion, HttpServletRequest request) {
		return servicio.crear(peticion, sesiones.actual(request).correo());
	}

	@GetMapping("/mias")
	public List<ReservaResponse> mias(HttpServletRequest request) {
		return servicio.mias(sesiones.actual(request).correo());
	}
}
