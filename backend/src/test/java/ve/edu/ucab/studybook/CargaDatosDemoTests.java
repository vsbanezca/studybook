package ve.edu.ucab.studybook;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.Profile;

import ve.edu.ucab.studybook.control.equipamiento.EquipamientoRepository;
import ve.edu.ucab.studybook.control.espacio.CargaEspaciosPrueba;
import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.model.Espacio;

/** Los datos de ejemplo de la demo: 3 espacios con capacidades distintas y 2 o 3 equipamientos cada uno, sin duplicar. */
class CargaDatosDemoTests {

	@Test
	void cargaTresEspaciosConEquipamientoYEsIdempotente(@TempDir Path carpeta) {
		EspacioRepository espacios = new EspacioRepository(carpeta.toString());
		EquipamientoRepository equipamientos = new EquipamientoRepository(carpeta.toString());
		CargaEspaciosPrueba carga = new CargaEspaciosPrueba(espacios, equipamientos);

		carga.run(null);
		carga.run(null);

		assertThat(espacios.listar()).hasSize(3);
		assertThat(espacios.listar().stream().map(Espacio::capacidad).distinct().count()).isEqualTo(3);
		for (Espacio e : espacios.listar()) {
			assertThat(equipamientos.listarPorEspacio(e.id()).size()).isBetween(2, 3);
		}
		// Un reinicio (repositorios nuevos sobre los mismos archivos) tampoco duplica.
		new CargaEspaciosPrueba(new EspacioRepository(carpeta.toString()), new EquipamientoRepository(carpeta.toString())).run(null);
		assertThat(new EspacioRepository(carpeta.toString()).listar()).hasSize(3);
	}

	@Test
	void elEquipamientoDeLaDemoTraeCantidadesDistintas(@TempDir Path carpeta) {
		EspacioRepository espacios = new EspacioRepository(carpeta.toString());
		EquipamientoRepository equipamientos = new EquipamientoRepository(carpeta.toString());
		new CargaEspaciosPrueba(espacios, equipamientos).run(null);
		var cantidades = espacios.listar().stream().flatMap(e -> equipamientos.listarPorEspacio(e.id()).stream())
				.map(q -> q.cantidad()).distinct().toList();
		assertThat(cantidades).contains(1, 2, 3);
	}

	@Test
	void soloSeCargaEnElPerfilDev() {
		Profile perfil = CargaEspaciosPrueba.class.getAnnotation(Profile.class);
		assertThat(perfil.value()).containsExactly("dev");
	}

	@Test
	void conservaLosEspaciosQueYaExisten(@TempDir Path carpeta) {
		EspacioRepository espacios = new EspacioRepository(carpeta.toString());
		EquipamientoRepository equipamientos = new EquipamientoRepository(carpeta.toString());
		espacios.guardar(new Espacio(null, "Sala propia", "Edificio X", "1", "", 3));
		new CargaEspaciosPrueba(espacios, equipamientos).run(null);
		assertThat(espacios.listar()).hasSize(4);
	}
}
