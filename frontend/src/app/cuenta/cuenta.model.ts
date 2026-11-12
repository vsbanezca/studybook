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

/** Datos que envia el formulario Registrarse. El rol no se envia: el servidor siempre asigna Miembro. */
export interface DatosRegistro {
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  clave: string;
}
