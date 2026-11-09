package ve.edu.ucab.studybook.control.comun;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Persistencia provisional en un archivo JSON (decision del esqueleto del proyecto).
 * Los repositorios concretos exponen solo operaciones de dominio, de modo que se pueda
 * reemplazar por una base de datos sin tocar servicios ni controladores.
 */
public abstract class JsonRepository<T> {

	private final JsonMapper mapper = JsonMapper.builder().build();
	private final Path archivo;
	private final TypeReference<List<T>> tipo;
	private final Function<T, Long> obtenerId;
	private final List<T> datos = new ArrayList<>();

	protected JsonRepository(Path archivo, TypeReference<List<T>> tipo, Function<T, Long> obtenerId) {
		this.archivo = archivo;
		this.tipo = tipo;
		this.obtenerId = obtenerId;
		cargar();
	}

	protected synchronized List<T> todos() {
		return List.copyOf(datos);
	}

	protected synchronized long siguienteId() {
		return datos.stream().map(obtenerId).mapToLong(Long::longValue).max().orElse(0L) + 1;
	}

	protected synchronized void agregar(T elemento) {
		datos.add(elemento);
		persistir();
	}

	private void cargar() {
		try {
			if (Files.exists(archivo) && Files.size(archivo) > 0) {
				datos.addAll(mapper.readValue(archivo.toFile(), tipo));
			}
		}
		catch (IOException e) {
			throw new UncheckedIOException("No se pudo leer " + archivo, e);
		}
	}

	private void persistir() {
		try {
			Files.createDirectories(archivo.toAbsolutePath().getParent());
			mapper.writerWithDefaultPrettyPrinter().writeValue(archivo.toFile(), datos);
		}
		catch (IOException e) {
			throw new UncheckedIOException("No se pudo escribir " + archivo, e);
		}
	}
}
