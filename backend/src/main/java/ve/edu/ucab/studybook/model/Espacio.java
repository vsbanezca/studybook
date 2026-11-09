package ve.edu.ucab.studybook.model;

public class Espacio {
    private String id;
    private String nombre;
    private String ubicacion;
    private String piso;
    private String descripcion;
    private int capacidad;

    public Espacio() {}

    public Espacio(String id, String nombre, String ubicacion, String piso, String descripcion, int capacidad) {
        this.id = id;
        this.nombre = nombre;
        this.ubicacion = ubicacion;
        this.piso = piso;
        this.descripcion = descripcion;
        this.capacidad = capacidad;
    }

    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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