package ve.edu.ucab.studybook.control.equipamiento;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;
import ve.edu.ucab.studybook.exceptions.NoEncontradoException;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Equipamiento;

@Service
public class EquipamientoService {

    private final EquipamientoRepository equipamientoRepository;
    private final EspacioRepository espacioRepository;

    public EquipamientoService(
            EquipamientoRepository equipamientoRepository,
            EspacioRepository espacioRepository
    ) {
        this.equipamientoRepository = equipamientoRepository;
        this.espacioRepository = espacioRepository;
    }

    public List<Equipamiento> consultarPorEspacio(Long espacioId) {
        if (!existeEspacio(espacioId)) {
            throw new NoEncontradoException(CodigosValidacion.ESPACIO_NO_EXISTE);
        }
        return equipamientoRepository.listarPorEspacio(espacioId);
    }

    /** El formato ya lo valido Bean Validation en EquipamientoRequest; aqui queda lo que necesita lo guardado. */
    public Equipamiento crearEquipamiento(EquipamientoRequest request) {
        if (!existeEspacio(request.getEspacioId())) {
            throw new ValidacionException(CodigosValidacion.ESPACIO_NO_EXISTE, "espacioId");
        }
        Equipamiento nuevo = new Equipamiento(null, request.getNombre().trim(), request.getCategoria().trim(),
                request.getDescripcion().trim(), request.getEstado().trim(), request.getCantidad(),
                request.getEspacioId());
        // Guardar controlando duplicados de forma segura (igual que en EspacioRepository)
        Optional<Equipamiento> resultado = equipamientoRepository.guardarSiNoExiste(nuevo);
        return resultado.orElseThrow(() -> ValidacionException.deRegla(CodigosValidacion.EQUIPAMIENTO_REPETIDO, "nombre"));
    }

    private boolean existeEspacio(Long espacioId) {
        return espacioRepository.listar().stream().anyMatch(e -> e.id().equals(espacioId));
    }
}
