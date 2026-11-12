import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Regla de telefono compartida (Registrarse y, mas adelante, Modificar mi cuenta).
 * Se quitan espacios, guiones y parentesis y despues se exige: + opcional al inicio y de 10 a 15 digitos.
 * Es la misma regla que backend/.../control/comun/Telefono.java.
 * SUPOSICION: el formato (10 a 15 digitos) se confirma con el equipo y la profesora.
 */
const SEPARADORES = /[\s\-()]/g;
const FORMATO = /^\+?\d{10,15}$/;

/** Quita espacios, guiones y parentesis. No valida nada. */
export function normalizarTelefono(valor: string | null | undefined): string {
  return (valor ?? '').replace(SEPARADORES, '');
}

/** Verdadero si el valor, una vez normalizado, cumple el formato. */
export function telefonoValido(valor: string | null | undefined): boolean {
  return FORMATO.test(normalizarTelefono(valor));
}

/** Validador de formularios: un valor vacio lo deja a Validators.required; el formato va con clave `telefono`. */
export const telefonoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor = control.value as string | null;
  if (!valor || normalizarTelefono(valor) === '') return null;
  return telefonoValido(valor) ? null : { telefono: true };
};
