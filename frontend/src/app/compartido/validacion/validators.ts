import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { normalizarTelefono } from '../telefono';
import { FORMATO_CORREO, FORMATO_TELEFONO, REGLAS, SOLO_DIGITOS } from './validation-rules';

// Validadores reutilizables. Todos dejan pasar el valor vacio (eso lo decide `obligatorio`) y devuelven
// una clave de error que el catalogo validation-messages.ts traduce a texto.

/** Fuente del reloj. En las pruebas se reemplaza por una fecha fija. */
export type Reloj = () => Date;

const relojDelNavegador: Reloj = () => new Date();

export function estaVacio(valor: unknown): boolean {
  return valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '');
}

/** Fecha (AAAA-MM-DD) y hora (HH:mm) actuales en la zona horaria de la especificacion, con el reloj del navegador. */
export function ahoraEnZona(reloj: Reloj = relojDelNavegador, zona: string = REGLAS.zonaHoraria): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(reloj());
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { fecha: `${parte('year')}-${parte('month')}-${parte('day')}`, hora: `${parte('hour')}:${parte('minute')}` };
}

/** Obligatorio: ni nulo ni solo espacios. Clave de error: `required`. */
export const obligatorio: ValidatorFn = (control) => (estaVacio(control.value) ? { required: true } : null);

/** Formato de correo. Clave: `correo`. */
export const correoValido: ValidatorFn = (control) => {
  if (estaVacio(control.value)) return null;
  return FORMATO_CORREO.test(String(control.value).trim()) ? null : { correo: true };
};

/** Con formato de correo valido, el dominio completo (despues de la ultima @) debe ser uno institucional. Clave: `dominio`. */
export const dominioInstitucional: ValidatorFn = (control) => {
  const valor = String(control.value ?? '').trim().toLowerCase();
  if (!FORMATO_CORREO.test(valor)) return null; // vacio y formato los reportan sus propios validadores
  const dominio = valor.substring(valor.lastIndexOf('@') + 1);
  return REGLAS.dominiosInstitucionales.includes(dominio) ? null : { dominio: true };
};

/** Solo digitos. Clave: `digitos`. */
export const soloDigitos: ValidatorFn = (control) => {
  if (estaVacio(control.value)) return null;
  return SOLO_DIGITOS.test(String(control.value).trim()) ? null : { digitos: true };
};

/** Verdadero si el telefono, una vez normalizado (sin espacios, guiones ni parentesis), cumple el formato. */
export function telefonoValido(valor: string | null | undefined): boolean {
  return FORMATO_TELEFONO.test(normalizarTelefono(valor));
}

/** Formato de telefono. Un valor vacio lo deja a `obligatorio`. Clave: `telefono`. */
export const telefonoValidator: ValidatorFn = (control) => {
  const valor = control.value as string | null;
  if (!valor || normalizarTelefono(valor) === '') return null;
  return telefonoValido(valor) ? null : { telefono: true };
};

/** Largo minimo en caracteres, sin recortar espacios (sirve para contrasenas). Clave: `minlength`. */
export function largoMinimo(minimo: number): ValidatorFn {
  return (control) => {
    const valor = control.value as string | null;
    if (valor === null || valor === undefined || valor === '') return null;
    return valor.length >= minimo ? null : { minlength: { requiredLength: minimo, actualLength: valor.length } };
  };
}

/** Largo maximo en bytes UTF-8, que es lo que cuenta BCrypt en el servidor. Clave: `maxlength`. */
export function bytesMaximos(maximo: number): ValidatorFn {
  return (control) => {
    const valor = control.value as string | null;
    if (valor === null || valor === undefined || valor === '') return null;
    const bytes = new TextEncoder().encode(valor).length;
    return bytes <= maximo ? null : { maxlength: { requiredLength: maximo, actualLength: bytes } };
  };
}

/** Numero entero mayor o igual a `minimo`. Clave: `entero`. */
export function enteroMinimo(minimo: number = REGLAS.enteroMinimo): ValidatorFn {
  return (control) => {
    if (estaVacio(control.value)) return null;
    const numero = Number(control.value);
    return Number.isInteger(numero) && numero >= minimo ? null : { entero: { minimo } };
  };
}

/** La fecha (AAAA-MM-DD) no puede ser anterior a hoy en la zona America/Caracas. Clave: `fechaPasada`. */
export function fechaNoPasada(reloj: Reloj = relojDelNavegador): ValidatorFn {
  return (control) => {
    if (estaVacio(control.value)) return null;
    return String(control.value) < ahoraEnZona(reloj).fecha ? { fechaPasada: true } : null;
  };
}

/**
 * Si la fecha elegida es hoy, la hora de inicio no puede ser anterior a la actual. La hora igual a la actual
 * (al minuto) se acepta, como en el servidor. Depende del campo `campoFecha` del mismo grupo. Clave: `horaPasada`.
 */
export function horaInicioNoPasada(campoFecha: string, reloj: Reloj = relojDelNavegador): ValidatorFn {
  return (control) => {
    const hora = control.value as string | null;
    const fecha = control.parent?.get(campoFecha)?.value as string | null | undefined;
    if (estaVacio(hora) || estaVacio(fecha)) return null;
    const ahora = ahoraEnZona(reloj);
    return fecha === ahora.fecha && String(hora) < ahora.hora ? { horaPasada: true } : null;
  };
}

/** La hora de fin debe ser posterior a la de inicio (campo `campoInicio` del mismo grupo). Clave: `finNoPosterior`. */
export function horaFinPosterior(campoInicio: string): ValidatorFn {
  return (control) => {
    const fin = control.value as string | null;
    const inicio = control.parent?.get(campoInicio)?.value as string | null | undefined;
    if (estaVacio(fin) || estaVacio(inicio)) return null;
    return String(fin) > String(inicio) ? null : { finNoPosterior: true };
  };
}

/** Los asistentes no pueden superar la capacidad del espacio elegido en `campoEspacio`. Clave: `capacidad`. */
export function dentroDeCapacidad(campoEspacio: string): ValidatorFn {
  return (control): ValidationErrors | null => {
    if (estaVacio(control.value)) return null;
    const espacio = control.parent?.get(campoEspacio)?.value as { capacidad: number } | null | undefined;
    if (!espacio) return null;
    return Number(control.value) > espacio.capacidad ? { capacidad: { maximo: espacio.capacidad } } : null;
  };
}

/**
 * Validacion entre campos: cada vez que cambia `origen`, `destino` se evalua de nuevo. Si `destino` ya tiene
 * un valor, se marca como tocado para que su error aparezca en cuanto exista (el usuario ya lo lleno).
 */
export function revalidarAlCambiar(origen: AbstractControl, destino: AbstractControl, destroyRef: DestroyRef): void {
  origen.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    if (!estaVacio(destino.value)) destino.markAsTouched();
    destino.updateValueAndValidity({ emitEvent: false });
  });
}

/** Regla de cuando mostrar el error: nunca en un campo intacto, solo despues de salir del campo o de presionar el boton. */
export function mostrarError(control: AbstractControl): boolean {
  return control.invalid && control.touched;
}

/** Marca un campo con un error que decidio el servidor (por ejemplo, correo ya registrado). Se limpia al editar el campo. */
export function marcarErrorServidor(control: AbstractControl, texto: string): void {
  control.setErrors({ servidor: texto });
  control.markAsTouched();
}
