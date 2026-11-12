package ve.edu.ucab.studybook.control.espacio;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import ve.edu.ucab.studybook.control.equipamiento.EquipamientoRepository;
import ve.edu.ucab.studybook.model.Equipamiento;
import ve.edu.ucab.studybook.model.Espacio;

/**
 * Datos de ejemplo para la demo, solo en el perfil "dev": 3 espacios con capacidades distintas y su equipamiento.
 * Es idempotente: cada espacio y cada equipamiento se agrega solo si todavia no existe, asi que arrancar
 * varias veces no duplica nada.
 */
@Component
@Profile("dev")
public class CargaEspaciosPrueba implements ApplicationRunner {

	private record Ejemplo(Espacio espacio, List<Equipamiento> equipamiento) {
	}

	private final EspacioRepository espacios;
	private final EquipamientoRepository equipamientos;

	public CargaEspaciosPrueba(EspacioRepository espacios, EquipamientoRepository equipamientos) {
		this.espacios = espacios;
		this.equipamientos = equipamientos;
	}

	@Override
	public void run(ApplicationArguments args) {
		for (Ejemplo ejemplo : ejemplos()) {
			Espacio e = ejemplo.espacio();
			espacios.guardarSiNoExiste(e);
			Long id = espacios.listar().stream()
					.filter(x -> x.nombre().equalsIgnoreCase(e.nombre()) && x.ubicacion().equalsIgnoreCase(e.ubicacion()))
					.findFirst().orElseThrow().id();
			for (Equipamiento q : ejemplo.equipamiento()) {
				equipamientos.guardarSiNoExiste(new Equipamiento(null, q.nombre(), q.categoria(), q.descripcion(), q.estado(), q.cantidad(), id));
			}
		}
	}

	private static List<Ejemplo> ejemplos() {
		return List.of(
				new Ejemplo(new Espacio(null, "Sala de estudio 1", "Biblioteca", "1", "Sala para grupos pequeños", 6), List.of(
						equipo("Pizarra blanca", "Mobiliario", "Pizarra blanca de pared", "Disponible", 1),
						equipo("Proyector", "Audiovisual", "Proyector con entrada HDMI", "Disponible", 1),
						equipo("Regleta de enchufes", "Electricidad", "Regleta con seis tomas", "Disponible", 3))),
				new Ejemplo(new Espacio(null, "Cubículo A", "Biblioteca", "2", "Cubículo individual", 2), List.of(
						equipo("Lámpara de escritorio", "Mobiliario", "Lámpara LED regulable", "Disponible", 1),
						equipo("Puerto USB de carga", "Electricidad", "Dos puertos USB en el escritorio", "Disponible", 2))),
				new Ejemplo(new Espacio(null, "Sala de reuniones", "Edificio de Ingeniería", "3", "Sala con pizarra", 12), List.of(
						equipo("Pantalla de 55 pulgadas", "Audiovisual", "Pantalla con conexión inalámbrica", "Disponible", 1),
						equipo("Pizarra blanca", "Mobiliario", "Pizarra blanca grande con marcadores", "Disponible", 2),
						equipo("Equipo de videollamada", "Audiovisual", "Cámara y micrófono de sala", "En mantenimiento", 1))));
	}

	private static Equipamiento equipo(String nombre, String categoria, String descripcion, String estado, int cantidad) {
		return new Equipamiento(null, nombre, categoria, descripcion, estado, cantidad, null);
	}
}
