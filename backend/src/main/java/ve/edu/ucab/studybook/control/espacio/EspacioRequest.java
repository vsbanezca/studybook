package ve.edu.ucab.studybook.control.espacio;

public class EspacioRequest {
    private String nombre;
    private String ubicacion;
    private String piso;
    private String descripcion;
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