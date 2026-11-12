package ve.edu.ucab.studybook.model;

public record Equipamiento(
        Long id,
        String nombre,
        String categoria,
        String descripcion,
        String estado,
        Integer cantidad,
        Long espacioId) {

    /** Un archivo JSON anterior a este campo no trae cantidad: se interpreta como 1. */
    public Equipamiento {
        if (cantidad == null || cantidad < 1) {
            cantidad = 1;
        }
    }

    public Equipamiento conId(Long nuevoId) {
        return new Equipamiento(nuevoId, nombre, categoria, descripcion, estado, cantidad, espacioId);
    }
}
