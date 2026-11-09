package ve.edu.ucab.studybook.control.cuenta;

import ve.edu.ucab.studybook.model.Rol;

/** Datos de la sesion que ve el cliente. Nunca incluye la clave. */
public record SesionResponse(String nombre, String correo, Rol rol) {
}
