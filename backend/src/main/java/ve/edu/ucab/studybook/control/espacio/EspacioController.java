package ve.edu.ucab.studybook.control.espacio;

import org.springframework.web.bind.annotation.*;
import ve.edu.ucab.studybook.model.Espacio;
import java.util.List;

@RestController
@RequestMapping("/api/espacios")
public class EspacioController {

    private final EspacioService espacioService;

    public EspacioController(EspacioService espacioService) {
        this.espacioService = espacioService;
    }

    // GET: Disponible para Miembros y Administradores
    @GetMapping
    public List<Espacio> consultarEspacios() {
        return espacioService.consultarEspacios();
    }

    // POST: El AutorizacionInterceptor debe verificar que el usuario tenga rol de Administrador
    @PostMapping
    public Espacio crearEspacio(@RequestBody EspacioRequest request) {
        return espacioService.crearEspacio(request);
    }
}