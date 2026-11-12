package ve.edu.ucab.studybook.control.equipamiento;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Equipamiento;

@Service
public class EquipamientoService {

    static final String CAMPO_OBLIGATORIO = "Este campo es obligatorio.";
    static final String ESPACIO_NO_EXISTE = "El espacio indicado no existe o fue eliminado.";
    static final String EQUIPAMIENTO_REPETIDO = "Ya existe un equipamiento con ese nombre en este espacio.";

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
        if (espacioId == null) {
            throw new ValidacionException(CAMPO_OBLIGATORIO, "espacioId");
        }
        return equipamientoRepository.listarPorEspacio(espacioId);
    }

    public Equipamiento crearEquipamiento(EquipamientoRequest request) {
        // 1. Validar campos obligatorios
        String nombre = validarObligatorio(request.getNombre(), "nombre");
        String categoria = validarObligatorio(request.getCategoria(), "categoría");
        String descripcion = validarObligatorio(request.getDescripcion(), "descripción");
        String estado = validarObligatorio(request.getEstado(), "estado");
        
        if (request.getEspacioId() == null) {
            throw new ValidacionException(CAMPO_OBLIGATORIO, "espacioId");
        }

        // 2. Validar que el espacio exista usando el metodo real: listar()
        boolean espacioExiste = espacioRepository.listar().stream()
                .anyMatch(e -> e.id().equals(request.getEspacioId())); 

        if (!espacioExiste) {
            throw new ValidacionException(ESPACIO_NO_EXISTE, "espacioId");
        }

        // 3. Crear el objeto
        Equipamiento nuevo = new Equipamiento(
                null, 
                nombre, 
                categoria, 
                descripcion, 
                estado, 
                request.getEspacioId()
        );

        // 4. Guardar controlando duplicados de forma segura (igual que en EspacioRepository)
        Optional<Equipamiento> resultado = equipamientoRepository.guardarSiNoExiste(nuevo);
        
        if (resultado.isEmpty()) {
            throw new ValidacionException(EQUIPAMIENTO_REPETIDO);
        }
        
        return resultado.get();
    }

    private static String validarObligatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new ValidacionException(CAMPO_OBLIGATORIO, campo);
        }
        return valor.trim();
    }
}