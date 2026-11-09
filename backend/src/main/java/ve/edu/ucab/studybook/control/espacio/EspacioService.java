package ve.edu.ucab.studybook.control.espacio;

import java.util.List;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Espacio;

@Service
public class EspacioService {

	// Textos de frontend/src/app/compartido/messages.ts
	static final String CAMPO_OBLIGATORIO = "Este campo es obligatorio.";
	static final String CAPACIDAD_INVALIDA = "La capacidad debe ser un número entero mayor que 0";

	private final EspacioRepository repositorio;

	public EspacioService(EspacioRepository repositorio) {
		this.repositorio = repositorio;
	}

	public List<Espacio> consultarEspacios() {
		return repositorio.listar();
	}

	public Espacio crearEspacio(EspacioRequest request) {
		String nombre = obligatorio(request.getNombre(), "nombre");
		String ubicacion = obligatorio(request.getUbicacion(), "ubicacion");
		String piso = obligatorio(request.getPiso(), "piso");
		if (request.getCapacidad() < 1) {
			throw new ValidacionException(CAPACIDAD_INVALIDA, "capacidad");
		}
		String descripcion = request.getDescripcion() == null ? "" : request.getDescripcion().trim();
		return repositorio.guardar(new Espacio(null, nombre, ubicacion, piso, descripcion, request.getCapacidad()));
	}

	private static String obligatorio(String valor, String campo) {
		if (valor == null || valor.isBlank()) {
			throw new ValidacionException(CAMPO_OBLIGATORIO, campo);
		}
		return valor.trim();
	}
}
