package ve.edu.ucab.studybook.control.espacio;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.model.Espacio;

/** Espacios de ejemplo, solo en el perfil "dev" y solo si no hay ninguno (para probar Crear reserva). */
@Component
@Profile("dev")
public class CargaEspaciosPrueba implements ApplicationRunner {

	private final EspacioRepository repositorio;

	public CargaEspaciosPrueba(EspacioRepository repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!repositorio.listar().isEmpty()) {
			return;
		}
		repositorio.guardar(new Espacio(null, "Sala de estudio 1", "Biblioteca", "1", "Sala para grupos pequeños", 6));
		repositorio.guardar(new Espacio(null, "Cubículo A", "Biblioteca", "2", "Cubículo individual", 2));
		repositorio.guardar(new Espacio(null, "Sala de reuniones", "Edificio de Ingeniería", "3", "Sala con pizarra", 12));
	}
}
