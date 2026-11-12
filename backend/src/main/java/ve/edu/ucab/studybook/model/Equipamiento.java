package ve.edu.ucab.studybook.model;

public record Equipamiento(
        Long id,
        String nombre,
        String categoria,
        String descripcion,
        String estado, 
        Long espacioId) {

    public Equipamiento conId(Long nuevoId) {
        return new Equipamiento(nuevoId, nombre, categoria, descripcion, estado, espacioId);
    }
}