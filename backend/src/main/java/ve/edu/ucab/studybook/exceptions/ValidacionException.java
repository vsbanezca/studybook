package ve.edu.ucab.studybook.exceptions;

public class ValidacionException extends RuntimeException {
    public ValidacionException(String mensaje) {
        super(mensaje); // Esta línea faltaba en tu código
    }
} // Asegúrate de borrar la "s" extra al final de esta llave