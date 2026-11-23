/**
 * Limpieza del telefono compartida (Registrarse y, mas adelante, Modificar mi cuenta): quita espacios, guiones y
 * parentesis antes de validar y de enviar. La validacion del formato vive en compartido/validacion
 * (FORMATO_TELEFONO y telefonoValidator). Es la misma regla que backend/.../control/comun/Telefono.java.
 */
const SEPARADORES = /[\s\-()]/g;

/** Quita espacios, guiones y parentesis. No valida nada. */
export function normalizarTelefono(valor: string | null | undefined): string {
  return (valor ?? '').replace(SEPARADORES, '');
}
