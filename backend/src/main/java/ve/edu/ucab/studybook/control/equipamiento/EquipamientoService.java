package ve.edu.ucab.studybook.control.equipamiento;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import ve.edu.ucab.studybook.control.espacio.EspacioRepository;
import ve.edu.ucab.studybook.exceptions.NoEncontradoException;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import ve.edu.ucab.studybook.model.Equipamiento;

@Service
public class EquipamientoService {

    // Textos de frontend/src/app/compartido/messages.ts
    static final String CAMPO_OBLIGATORIO = "Este campo es obligatorio.";
    static final String ESPACIO_NO_EXISTE = "El espacio indicado no existe";
    // SUPOSICION: texto propuesto para el duplicado, a confirmar con el equipo.
    static final String EQUIPAMIENTO_REPETIDO = "Ya existe ese equipamiento en este espacio";
    static final String CANTIDAD_INVALIDA = "La cantidad debe ser un número entero mayor o igual a 1";

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
        if (!existeEspacio(espacioId)) {
            throw new NoEncontradoException(ESPACIO_NO_EXISTE);
        }
        return equipamientoRepository.listarPorEspacio(espacioId);
    }

    public Equipamiento crearEquipamiento(EquipamientoRequest request) {
        // 1. Validar campos obligatorios
        String nombre = validarObligatorio(request.getNombre(), "nombre");
        String categoria = validarObligatorio(request.getCategoria(), "categoria");
        String descripcion = validarObligatorio(request.getDescripcion(), "descripcion");
        String estado = validarObligatorio(request.getEstado(), "estado");
        int cantidad = validarCantidad(request.getCantidad());
        
        if (request.getEspacioId() == null) {
            throw new ValidacionException(CAMPO_OBLIGATORIO, "espacioId");
        }

        // 2. Validar que el espacio exista usando el metodo real: listar()
        if (!existeEspacio(request.getEspacioId())) {
            throw new ValidacionException(ESPACIO_NO_EXISTE, "espacioId");
        }

        // 3. Crear el objeto
        Equipamiento nuevo = new Equipamiento(
                null, 
                nombre, 
                categoria, 
                descripcion, 
                estado,
                cantidad,
                request.getEspacioId()
        );

        // 4. Guardar controlando duplicados de forma segura (igual que en EspacioRepository)
        Optional<Equipamiento> resultado = equipamientoRepository.guardarSiNoExiste(nuevo);
        
        if (resultado.isEmpty()) {
            throw new ValidacionException(EQUIPAMIENTO_REPETIDO);
        }
        
        return resultado.get();
    }

    private static int validarCantidad(String texto) {
        String valor = validarObligatorio(texto, "cantidad");
        try {
            int cantidad = Integer.parseInt(valor);
            if (cantidad >= 1) {
                return cantidad;
            }
        } catch (NumberFormatException e) {
            // se informa abajo
        }
        throw new ValidacionException(CANTIDAD_INVALIDA, "cantidad");
    }

    private boolean existeEspacio(Long espacioId) {
        return espacioRepository.listar().stream().anyMatch(e -> e.id().equals(espacioId));
    }

    private static String validarObligatorio(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new ValidacionException(CAMPO_OBLIGATORIO, campo);
        }
        return valor.trim();
    }
}