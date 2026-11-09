package ve.edu.ucab.studybook.control.espacio;

import java.nio.file.Path;
import java.util.List;

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
}
