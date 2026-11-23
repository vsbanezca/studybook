// Constantes de las reglas de validacion. Un solo lugar: los validadores y las pantallas las importan de aqui.
// SUPOSICION: valores iniciales a confirmar con el equipo y la profesora (ver docs-local/Suposiciones_pendientes.md).

/** Formato de correo electronico. La misma regla que el servidor (Bean Validation en LoginRequest y RegistroRequest). */
export const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SOLO_DIGITOS = /^\d+$/;

/**
 * Telefono ya normalizado (sin espacios, guiones ni parentesis): + opcional al inicio y de 10 a 15 digitos.
 * La misma regla que el servidor (Telefono.java y @TelefonoValido en RegistroRequest).
 * SUPOSICION: el formato (10 a 15 digitos) se confirma con el equipo y la profesora.
 */
export const FORMATO_TELEFONO = /^\+?\d{10,15}$/;

export const REGLAS = {
  clave: {
    minimo: 8,
    /** BCrypt solo usa los primeros 72 bytes: el servidor rechaza una clave mas larga en vez de truncarla. */
    maximoBytes: 72,
  },
  /** Mismos dominios que `studybook.registro.dominios` del servidor. Si cambia la propiedad, hay que cambiar esta lista. */
  dominiosInstitucionales: ['ucab.edu.ve', 'est.ucab.edu.ve'] as readonly string[],
  /** Zona horaria de las reglas de fecha y hora (especificacion v2.1 de Crear reserva). */
  zonaHoraria: 'America/Caracas',
  /** Enteros que empiezan en 1: asistentes, cantidad y capacidad. */
  enteroMinimo: 1,
} as const;
