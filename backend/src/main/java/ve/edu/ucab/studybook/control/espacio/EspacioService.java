package ve.edu.ucab.studybook.control.espacio;

import java.util.List;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Espacio;

@Service
public class EspacioService {

	// Depende de lo guardado: lo decide el servidor y el frontend lo muestra tal cual.
	static final String ESPACIO_REPETIDO = "Ya existe un espacio con ese nombre en esa ubicación";

	private final EspacioRepository repositorio;

	public EspacioService(EspacioRepository repositorio) {
		this.repositorio = repositorio;
	}

	public List<Espacio> consultarEspacios() {
		return repositorio.listar();
	}

	/** El formato ya lo valido Bean Validation en EspacioRequest. */
	public Espacio crearEspacio(EspacioRequest request) {
		String descripcion = request.getDescripcion() == null ? "" : request.getDescripcion().trim();
		return repositorio
				.guardarSiNoExiste(new Espacio(null, request.getNombre().trim(), request.getUbicacion().trim(),
						request.getPiso().trim(), descripcion, request.getCapacidad()))
				.orElseThrow(() -> ValidacionException.literal(ESPACIO_REPETIDO, "nombre"));
	}
}
