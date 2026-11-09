package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

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

	@Test
	void guardarSiNoExisteIgnoraMayusculasYEspaciosSobrantes() {
		EspacioRepository repo = new EspacioRepository(dir.toString());
		assertThat(repo.guardarSiNoExiste(new Espacio(null, "Sala 1", "Biblioteca", "2", "", 6))).isPresent();
		assertThat(repo.guardarSiNoExiste(new Espacio(null, "  sala 1 ", " BIBLIOTECA ", "3", "", 4))).isEmpty();
		assertThat(repo.guardarSiNoExiste(new Espacio(null, "Sala 1", "Otra ubicación", "2", "", 6))).isPresent();
		assertThat(repo.listar()).hasSize(2);
	}

	@Test
	void dosHilosSimultaneosCreanUnSoloEspacio() throws Exception {
		EspacioRepository repo = new EspacioRepository(dir.toString());
		int hilos = 8;
		ExecutorService pool = Executors.newFixedThreadPool(hilos);
		CountDownLatch salida = new CountDownLatch(1);
		List<Future<Boolean>> resultados = new ArrayList<>();
		for (int i = 0; i < hilos; i++) {
			resultados.add(pool.submit(() -> {
				salida.await();
				return repo.guardarSiNoExiste(new Espacio(null, "Sala 1", "Biblioteca", "2", "", 6)).isPresent();
			}));
		}
		salida.countDown();
		int creados = 0;
		for (Future<Boolean> f : resultados) {
			if (f.get()) {
				creados++;
			}
		}
		pool.shutdown();
		assertThat(creados).isEqualTo(1);
		assertThat(new EspacioRepository(dir.toString()).listar()).hasSize(1);
	}
}
