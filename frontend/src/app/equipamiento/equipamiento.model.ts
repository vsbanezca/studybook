/**
 * Equipamiento de un espacio. Los campos son los del backend de Jose Quintero:
 * nombre, categoria, descripcion y estado (todos obligatorios).
 * SUPOSICION: categoria y estado son texto libre; no hay lista de valores definida.
 */
export interface Equipamiento {
  id?: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  estado: string;
  espacioId: number;
}
