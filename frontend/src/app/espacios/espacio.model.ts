/** Modelo minimo de un espacio de estudio. Ampliar segun la historia Crear espacio. */
export interface Espacio {
  id?: number | string;
  nombre: string;
  ubicacion: string;
  piso: number | string;
  capacidad: number;
}
