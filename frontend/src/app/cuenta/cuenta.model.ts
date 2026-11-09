export type Rol = 'MIEMBRO' | 'ADMINISTRADOR';

/** Sesion que devuelve el servidor. Nunca incluye la clave. */
export interface Sesion {
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface CredencialesLogin {
  correo: string;
  clave: string;
}
