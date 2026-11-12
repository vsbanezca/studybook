package ve.edu.ucab.studybook.control.equipamiento;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import ve.edu.ucab.studybook.model.Equipamiento;

@RestController
@RequestMapping("/api/equipamientos")
public class EquipamientoController {

    private final EquipamientoService equipamientoService;

    public EquipamientoController(EquipamientoService equipamientoService) {
        this.equipamientoService = equipamientoService;
    }

    @GetMapping
    public List<Equipamiento> consultarPorEspacio(@RequestParam Long espacioId) {
        return equipamientoService.consultarPorEspacio(espacioId);
    }

    @PostMapping
    public Equipamiento crearEquipamiento(@RequestBody EquipamientoRequest request) {
        return equipamientoService.crearEquipamiento(request);
    }
}