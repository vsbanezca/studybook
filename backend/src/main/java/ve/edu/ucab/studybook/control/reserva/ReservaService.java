package ve.edu.ucab.studybook.control.reserva;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.exceptions.ConflictoException;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.EstadoReserva;
import ve.edu.ucab.studybook.model.Espacio;
import ve.edu.ucab.studybook.model.Reserva;

@Service
public class ReservaService {

	// Textos LITERALES de la especificacion (frontend/src/app/compartido/messages.ts)
	static final String CAPACIDAD_EXCEDIDA = "La cantidad de asistentes supera la capacidad del espacio";
	static final String NO_DISPONIBLE = "El espacio ya está reservado en esa fecha y horario";
	static final String ESPACIO_NO_EXISTE = "El espacio indicado no existe";

	private final ReservaRepository reservas;
	private final EspacioRepository espacios;
	private final ReservaValidador validador;

	public ReservaService(ReservaRepository reservas, EspacioRepository espacios, ReservaValidador validador) {
		this.reservas = reservas;
		this.espacios = espacios;
		this.validador = validador;
	}

	/** Aplica todas las reglas (datos, capacidad, disponibilidad) sin guardar nada. */
	public void validar(ReservaRequest peticion) {
		revisar(peticion);
	}

	/** Revalida todo y registra. La disponibilidad se comprueba y se guarda de forma atomica. */
	public ReservaResponse crear(ReservaRequest peticion, String miembro) {
		ReservaValidador.Datos d = revisar(peticion);
		Espacio espacio = buscarEspacio(d.espacioId());
		Reserva nueva = new Reserva(null, null, miembro, d.espacioId(), d.fecha(), d.horaInicio(), d.horaFin(),
				d.asistentes(), EstadoReserva.ACTIVA);
		Reserva guardada = reservas.guardarSiDisponible(nueva)
				.orElseThrow(() -> new ConflictoException(NO_DISPONIBLE, "fecha"));
		return ReservaResponse.de(guardada, espacio);
	}

	/** Reservas del miembro: las proximas primero (de la mas cercana a la mas lejana) y despues las pasadas. */
	public List<ReservaResponse> mias(String miembro) {
		LocalDateTime ahora = LocalDateTime.now();
		Comparator<Reserva> porMomento = Comparator.comparing((Reserva r) -> r.fecha().atTime(r.horaInicio()));
		List<Reserva> propias = reservas.listarPorMiembro(miembro);
		List<Reserva> proximas = propias.stream().filter(r -> !r.fecha().atTime(r.horaFin()).isBefore(ahora))
				.sorted(porMomento).toList();
		List<Reserva> pasadas = propias.stream().filter(r -> r.fecha().atTime(r.horaFin()).isBefore(ahora))
				.sorted(porMomento.reversed()).toList();
		return Stream.concat(proximas.stream(), pasadas.stream())
				.map(r -> ReservaResponse.de(r, buscarEspacio(r.espacioId()))).toList();
	}

	private ReservaValidador.Datos revisar(ReservaRequest peticion) {
		ReservaValidador.Datos d = validador.validar(peticion, LocalDate.now());
		Espacio espacio = buscarEspacio(d.espacioId());
		if (d.asistentes() > espacio.capacidad()) {
			throw ValidacionException.literal(CAPACIDAD_EXCEDIDA, "asistentes");
		}
		if (reservas.hayChoque(d.espacioId(), d.fecha(), d.horaInicio(), d.horaFin())) {
			throw new ConflictoException(NO_DISPONIBLE, "fecha");
		}
		return d;
	}

	private Espacio buscarEspacio(Long id) {
		return espacios.listar().stream().filter(e -> e.id().equals(id)).findFirst()
				.orElseThrow(() -> new ValidacionException(ESPACIO_NO_EXISTE, "espacioId"));
	}
}
