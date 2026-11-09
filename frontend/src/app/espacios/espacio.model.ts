export interface Espacio {
  id?: string;
  nombre: string;
  ubicacion: string;
  piso: string;
  descripcion?: string; // El "?" le dice a Angular que este dato puede faltar
  capacidad: number;
}