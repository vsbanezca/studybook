package ve.edu.ucab.studybook.control.espacio;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

/** Red de seguridad: el formulario ya valida esto en el frontend; aqui responde 400 con el campo y un codigo. */
public class EspacioRequest {
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String nombre;
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String ubicacion;
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String piso;
    private String descripcion;
    @Min(value = 1, message = CodigosValidacion.MINIMO)
    private int capacidad;

    // Getters y Setters requeridos para mapear el JSON
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }
    public String getPiso() { return piso; }
    public void setPiso(String piso) { this.piso = piso; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public int getCapacidad() { return capacidad; }
    public void setCapacidad(int capacidad) { this.capacidad = capacidad; }
}