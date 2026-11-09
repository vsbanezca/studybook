package ve.edu.ucab.studybook.control.cuenta;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import tools.jackson.core.type.TypeReference;
import ve.edu.ucab.studybook.control.comun.JsonRepository;
import ve.edu.ucab.studybook.model.Cuenta;
import ve.edu.ucab.studybook.model.Rol;

/** Acceso a datos de cuentas. Almacenamiento provisional en JSON (ver JsonRepository). */
@Repository
public class CuentaRepository extends JsonRepository<Cuenta> {

	public CuentaRepository(@Value("${studybook.datos.dir}") String dir) {
		super(Path.of(dir, "cuentas.json"), new TypeReference<List<Cuenta>>() {
		}, Cuenta::id);
	}

	public Optional<Cuenta> buscarPorCorreo(String correo) {
		return todos().stream().filter(c -> c.correo().equalsIgnoreCase(correo)).findFirst();
	}

	public boolean existeRol(Rol rol) {
		return todos().stream().anyMatch(c -> c.rol() == rol);
	}

	public synchronized Cuenta guardar(Cuenta cuenta) {
		Cuenta nueva = cuenta.conId(siguienteId());
		agregar(nueva);
		return nueva;
	}
}
