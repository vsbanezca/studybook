package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.model.Espacio;

class EspacioRepositoryTests {

	@TempDir
	Path dir;

	@Test
	void crearPersisteYUnRepositorioNuevoVeElEspacio() {
		EspacioRepository primero = new EspacioRepository(dir.toString());
		Espacio creado = primero.guardar(new Espacio(null, "Sala 1", "Biblioteca", "2", "", 6));
		assertThat(creado.id()).isEqualTo(1L);

		EspacioRepository segundo = new EspacioRepository(dir.toString());
		assertThat(segundo.listar()).containsExactly(creado);
	}

	@Test
	void losIdentificadoresSonConsecutivos() {
		EspacioRepository repo = new EspacioRepository(dir.toString());
		repo.guardar(new Espacio(null, "A", "X", "1", "", 1));
		assertThat(repo.guardar(new Espacio(null, "B", "X", "1", "", 1)).id()).isEqualTo(2L);
	}
}
