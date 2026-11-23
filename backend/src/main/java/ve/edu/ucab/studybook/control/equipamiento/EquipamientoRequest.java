package ve.edu.ucab.studybook.control.equipamiento;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ve.edu.ucab.studybook.exceptions.CodigosValidacion;

/** Red de seguridad: el formulario ya valida esto en el frontend; aqui responde 400 con el campo y un codigo. */
public class EquipamientoRequest {
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String nombre;
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String categoria;
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String descripcion;
    @NotBlank(message = CodigosValidacion.OBLIGATORIO)
    private String estado;
    // Un valor que no sea numero entero lo rechaza GlobalExceptionHandler indicando este campo.
    @NotNull(message = CodigosValidacion.OBLIGATORIO)
    @Min(value = 1, message = CodigosValidacion.MINIMO)
    private Integer cantidad;
    @NotNull(message = CodigosValidacion.OBLIGATORIO)
    private Long espacioId;

    //Getters y Setters 
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Long getEspacioId() { return espacioId; }
    public void setEspacioId(Long espacioId) { this.espacioId = espacioId; }
}