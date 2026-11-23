import { FormGroup, ValidationErrors } from '@angular/forms';
import { MSG } from '../messages';
import { REGLAS } from './validation-rules';

// Catalogo de mensajes. Los textos viven en messages.ts (una sola fuente); aqui solo se decide cual texto
// corresponde a cada clave de error del formulario y a cada codigo del servidor. El servidor no redacta textos:
// responde codigos estables (ver textoDeCodigo y textoDeMensaje).

/** Textos que una pantalla cambia para un campo concreto, por clave de error. */
export type Mensajes = Partial<Record<string, string>>;

export interface ErrorCampo {
  campo: string;
  etiqueta: string;
  texto: string;
}

/** Orden en que se elige el mensaje cuando un campo tiene mas de un error. */
const PRIORIDAD = [
  'servidor', 'required', 'correo', 'dominio', 'digitos', 'telefono', 'minlength', 'maxlength', 'entero',
  'fechaPasada', 'horaPasada', 'finNoPosterior', 'capacidad',
];

const PREDETERMINADOS: Record<string, string> = {
  required: MSG.comunes.campoObligatorio,
  correo: MSG.cuenta.correoFormato,
  dominio: MSG.cuenta.correoNoInstitucional,
  digitos: 'Usa solo números',
  telefono: MSG.cuenta.telefonoFormato,
  entero: `Ingresa un número entero mayor o igual a ${REGLAS.enteroMinimo}`,
  fechaPasada: MSG.reserva.fechaPasada,
  horaPasada: MSG.reserva.horaInicioPasada,
  finNoPosterior: MSG.reserva.finNoPosterior,
};

/** Texto de la regla de capacidad de un espacio. */
export const textoCapacidad = (maximo: number): string => `Supera la capacidad del espacio (máximo ${maximo})`;

/** Texto del primer error del campo, o cadena vacia si no tiene errores. */
export function mensajeDeError(errores: ValidationErrors | null, mensajes: Mensajes = {}): string {
  if (!errores) return '';
  const clave = PRIORIDAD.find((k) => k in errores) ?? Object.keys(errores)[0];
  if (clave === undefined) return '';
  if (clave === 'servidor') return String(errores['servidor']);
  const propio = mensajes[clave];
  if (propio !== undefined) return propio;
  if (clave === 'capacidad') return textoCapacidad((errores['capacidad'] as { maximo: number }).maximo);
  if (clave === 'minlength') return `Debe tener al menos ${(errores['minlength'] as { requiredLength: number }).requiredLength} caracteres`;
  if (clave === 'maxlength') return `Debe tener como máximo ${(errores['maxlength'] as { requiredLength: number }).requiredLength} caracteres`;
  return PREDETERMINADOS[clave] ?? MSG.comunes.datosInvalidos;
}

/**
 * Campos con error de un formulario, en el orden de sus controles. Sirve para el modal «Datos proporcionados
 * incorrectos» (una linea por campo).
 */
export function listarErrores(grupo: FormGroup, etiquetas: Record<string, string>, mensajes: Record<string, Mensajes> = {}): ErrorCampo[] {
  return Object.keys(grupo.controls)
    .filter((campo) => grupo.controls[campo].invalid)
    .map((campo) => ({
      campo,
      etiqueta: etiquetas[campo] ?? campo,
      texto: mensajeDeError(grupo.controls[campo].errors, mensajes[campo]),
    }));
}

// Codigos de error del servidor (backend/.../exceptions/CodigosValidacion.java). El servidor nunca manda textos:
// en "mensaje" manda el codigo general y en "campos" el codigo de cada campo. Este es el unico traductor.
const TEXTOS_POR_CODIGO: Record<string, string> = {
  // Generales (van en "mensaje")
  datos_invalidos: MSG.comunes.datosInvalidos,
  sin_permiso: MSG.espacio.sinPermiso,
  sesion_requerida: MSG.comunes.sesionRequerida,
  credenciales_incorrectas: MSG.cuenta.credencialesMal,
  // Reglas de negocio (dependen de lo guardado; las decide el servidor)
  correo_registrado: MSG.cuenta.correoRegistrado,
  cedula_registrada: MSG.cuenta.cedulaRegistrada,
  espacio_repetido: MSG.espacio.repetido,
  espacio_no_existe: MSG.equipamiento.espacioNoExiste,
  equipamiento_repetido: MSG.equipamiento.repetido,
  capacidad_excedida: MSG.reserva.capacidadExcedida,
  no_disponible: MSG.reserva.noDisponible,
  // Formato (Bean Validation y reglas del reloj del servidor)
  obligatorio: MSG.comunes.campoObligatorio,
  formato: 'El formato no es válido',
  minimo: `Ingresa un número entero mayor o igual a ${REGLAS.enteroMinimo}`,
  longitud_minima: 'El valor es demasiado corto',
  longitud_maxima: 'El valor es demasiado largo',
  dominio_no_institucional: MSG.cuenta.correoNoInstitucional,
  fecha_pasada: MSG.reserva.fechaPasada,
  hora_inicio_pasada: MSG.reserva.horaInicioPasada,
  fin_no_posterior: MSG.reserva.finNoPosterior,
};

/** Textos mas precisos para un codigo en un campo concreto (clave `campo.codigo`). */
const TEXTOS_POR_CAMPO: Record<string, string> = {
  'cedula.formato': MSG.cuenta.cedulaFormato,
  'correo.formato': MSG.cuenta.correoFormato,
  'telefono.formato': MSG.cuenta.telefonoFormato,
  'clave.longitud_minima': MSG.cuenta.claveCorta,
  'clave.longitud_maxima': MSG.cuenta.claveLarga,
  'capacidad.minimo': MSG.espacio.capacidadInvalida,
  'cantidad.minimo': MSG.equipamiento.cantidadInvalida,
  'asistentes.minimo': MSG.reserva.asistentesInvalidos,
};

/**
 * Convierte el codigo que el servidor responde para un campo en texto: primero el texto propio del campo
 * (`campo.codigo`), luego el del codigo. Un codigo desconocido muestra el texto generico de datos invalidos.
 */
export function textoDeCodigo(campo: string, codigo: string): string {
  return TEXTOS_POR_CAMPO[`${campo}.${codigo}`] ?? TEXTOS_POR_CODIGO[codigo] ?? MSG.comunes.datosInvalidos;
}

/**
 * Convierte el codigo general de una respuesta de error ("mensaje") en el titulo del modal. Sin codigo o con uno
 * desconocido devuelve el texto generico de datos invalidos.
 */
export function textoDeMensaje(codigo: string | null | undefined): string {
  return (codigo ? TEXTOS_POR_CODIGO[codigo] : undefined) ?? MSG.comunes.datosInvalidos;
}
