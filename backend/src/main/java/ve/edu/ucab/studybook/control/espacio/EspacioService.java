package ve.edu.ucab.studybook.control.espacio;

import org.springframework.stereotype.Service;
import ve.edu.ucab.studybook.model.Espacio;
import ve.edu.ucab.studybook.exceptions.ValidacionException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EspacioService {
    // Simulación de base de datos en memoria para la primera iteración
    private List<Espacio> espacios = new ArrayList<>();

    public List<Espacio> consultarEspacios() {
        return espacios;
    }

    public Espacio crearEspacio(EspacioRequest request) {
        if (request.getCapacidad() <= 0) {
            throw new ValidacionException("La capacidad debe ser mayor que 0.");
        }
        
        Espacio nuevoEspacio = new Espacio(
            UUID.randomUUID().toString(),
            request.getNombre(),
            request.getUbicacion(),
            request.getPiso(),
            request.getDescripcion(),
            request.getCapacidad()
        );
        espacios.add(nuevoEspacio);
        return nuevoEspacio;
    }
}