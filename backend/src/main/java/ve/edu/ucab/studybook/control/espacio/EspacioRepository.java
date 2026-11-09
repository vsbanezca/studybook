package ve.edu.ucab.studybook.control.espacio;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import tools.jackson.core.type.TypeReference;
import ve.edu.ucab.studybook.control.comun.JsonRepository;
import ve.edu.ucab.studybook.model.Espacio;

/** Acceso a datos de espacios. Almacenamiento provisional en JSON (ver JsonRepository). */
@Repository
public class EspacioRepository extends JsonRepository<Espacio> {

	public EspacioRepository(@Value("${studybook.datos.dir}") String dir) {
		super(Path.of(dir, "espacios.json"), new TypeReference<List<Espacio>>() {
		}, Espacio::id);
	}

	public List<Espacio> listar() {
		return todos();
	}

	public synchronized Espacio guardar(Espacio espacio) {
		Espacio nuevo = espacio.conId(siguienteId());
		agregar(nuevo);
		return nuevo;
	}

	/**
	 * Comprueba y guarda en una sola seccion sincronizada: dos peticiones simultaneas con el mismo
	 * nombre y ubicacion no pueden crear dos espacios. Devuelve vacio si ya existia uno igual.
	 */
	public synchronized Optional<Espacio> guardarSiNoExiste(Espacio espacio) {
		boolean repetido = todos().stream().anyMatch(e -> mismoNombreYUbicacion(e, espacio));
		return repetido ? Optional.empty() : Optional.of(guardar(espacio));
	}

	private static boolean mismoNombreYUbicacion(Espacio a, Espacio b) {
		return a.nombre().trim().equalsIgnoreCase(b.nombre().trim())
				&& a.ubicacion().trim().equalsIgnoreCase(b.ubicacion().trim());
	}
}
