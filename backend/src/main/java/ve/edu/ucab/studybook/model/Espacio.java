package ve.edu.ucab.studybook.model;

/** Espacio reservable (sala, cubiculo, etc.). */
public record Espacio(
		Long id,
		String nombre,
		String ubicacion,
		String piso,
		String descripcion,
		int capacidad) {

	public Espacio conId(Long nuevoId) {
		return new Espacio(nuevoId, nombre, ubicacion, piso, descripcion, capacidad);
	}
}
