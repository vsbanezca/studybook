package ve.edu.ucab.studybook.control.equipamiento;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import tools.jackson.core.type.TypeReference;
import ve.edu.ucab.studybook.control.comun.JsonRepository;
import ve.edu.ucab.studybook.model.Equipamiento;

@Repository
public class EquipamientoRepository extends JsonRepository<Equipamiento> {

    public EquipamientoRepository(@Value("${studybook.datos.dir}") String dir) {
        super(Path.of(dir, "equipamientos.json"), new TypeReference<List<Equipamiento>>() {
        }, Equipamiento::id);
    }

    public List<Equipamiento> listar() {
        return todos();
    }

    public List<Equipamiento> listarPorEspacio(Long espacioId) {
        return todos().stream()
                .filter(e -> e.espacioId().equals(espacioId))
                .toList();
    }

    public synchronized Equipamiento guardar(Equipamiento equipamiento) {
        Equipamiento nuevo = equipamiento.conId(siguienteId());
        agregar(nuevo);
        return nuevo;
    }

    
    public synchronized Optional<Equipamiento> guardarSiNoExiste(Equipamiento equipamiento) {
        // Mismo nombre en el mismo espacio, sin distinguir mayusculas ni espacios sobrantes (tambien internos).
        boolean repetido = todos().stream().anyMatch(e ->
            e.espacioId().equals(equipamiento.espacioId()) &&
            comparable(e.nombre()).equals(comparable(equipamiento.nombre()))
        );
        return repetido ? Optional.empty() : Optional.of(guardar(equipamiento));
    }

    private static String comparable(String nombre) {
        return nombre.trim().replaceAll("\s+", " ").toLowerCase(java.util.Locale.ROOT);
    }
}
