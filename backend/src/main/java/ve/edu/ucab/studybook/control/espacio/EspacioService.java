package ve.edu.ucab.studybook.control.espacio;

import java.util.List;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Espacio;

@Service
public class EspacioService {

	private final EspacioRepository repositorio;

	public EspacioService(EspacioRepository repositorio) {
		this.repositorio = repositorio;
	}

	public List<Espacio> consultarEspacios() {
		return repositorio.listar();
	}

	public Espacio crearEspacio(EspacioRequest request) {
		if (request.getCapacidad() <= 0) {
			throw new ValidacionException("La capacidad debe ser mayor que 0.");
		}
		return repositorio.guardar(new Espacio(null, request.getNombre(), request.getUbicacion(), request.getPiso(),
				request.getDescripcion(), request.getCapacidad()));
	}
}
