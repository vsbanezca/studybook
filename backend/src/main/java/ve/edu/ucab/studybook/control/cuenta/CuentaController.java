package ve.edu.ucab.studybook.control.cuenta;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import ve.edu.ucab.studybook.control.seguridad.SesionService;
import ve.edu.ucab.studybook.model.Cuenta;

@RestController
@RequestMapping("/api/auth")
public class CuentaController {

	private final CuentaService servicio;
	private final SesionService sesiones;

	public CuentaController(CuentaService servicio, SesionService sesiones) {
		this.servicio = servicio;
		this.sesiones = sesiones;
	}

	@PostMapping("/login")
	public SesionResponse iniciarSesion(@Valid @RequestBody LoginRequest peticion, HttpServletRequest request) {
		Cuenta cuenta = servicio.autenticar(peticion.correo(), peticion.clave());
		sesiones.iniciar(request, cuenta);
		return new SesionResponse(cuenta.nombre(), cuenta.correo(), cuenta.rol());
	}

	/** Registro publico (no exige sesion). Crea una cuenta de Miembro y NO inicia sesion. */
	@PostMapping("/registro")
	@ResponseStatus(HttpStatus.CREATED)
	public SesionResponse registrar(@RequestBody RegistroRequest peticion) {
		Cuenta cuenta = servicio.registrar(peticion);
		return new SesionResponse(cuenta.nombre(), cuenta.correo(), cuenta.rol());
	}

	/** Permite al cliente recuperar la sesion al recargar la pagina. */
	@GetMapping("/sesion")
	public SesionResponse sesionActual(HttpServletRequest request) {
		return sesiones.actual(request);
	}
}
