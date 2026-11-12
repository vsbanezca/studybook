package ve.edu.ucab.studybook.control.reserva;

import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import tools.jackson.core.type.TypeReference;
import ve.edu.ucab.studybook.control.comun.JsonRepository;
import ve.edu.ucab.studybook.model.EstadoReserva;
import ve.edu.ucab.studybook.model.Reserva;

/** Acceso a datos de reservas. Almacenamiento provisional en JSON (ver JsonRepository). */
@Repository
public class ReservaRepository extends JsonRepository<Reserva> {

	public ReservaRepository(@Value("${studybook.datos.dir}") String dir) {
		super(Path.of(dir, "reservas.json"), new TypeReference<List<Reserva>>() {
		}, Reserva::id);
	}

	public List<Reserva> listar() {
		return todos();
	}

	public List<Reserva> listarPorMiembro(String miembro) {
		return todos().stream().filter(r -> r.miembro().equalsIgnoreCase(miembro)).toList();
	}

	/** Solo las reservas ACTIVAS bloquean el horario. */
	public boolean hayChoque(Long espacioId, LocalDate fecha, LocalTime inicio, LocalTime fin) {
		return todos().stream().anyMatch(r -> r.estado() == EstadoReserva.ACTIVA && r.espacioId().equals(espacioId)
				&& r.seSolapaCon(fecha, inicio, fin));
	}

	/** Guarda sin comprobar nada (para preparar datos). */
	public synchronized Reserva guardar(Reserva reserva) {
		Reserva nueva = reserva.conId(siguienteId());
		agregar(nueva);
		return nueva;
	}

	/**
	 * Comprueba la disponibilidad y guarda en una sola seccion sincronizada: dos peticiones simultaneas
	 * para el mismo espacio y horario no pueden crear dos reservas. Devuelve vacio si hay choque.
	 */
	public synchronized Optional<Reserva> guardarSiDisponible(Reserva reserva) {
		if (hayChoque(reserva.espacioId(), reserva.fecha(), reserva.horaInicio(), reserva.horaFin())) {
			return Optional.empty();
		}
		return Optional.of(guardar(reserva));
	}
}
