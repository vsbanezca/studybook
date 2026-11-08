const FECHA = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Recibe el valor de un input type="date" ("2026-11-09") y lo devuelve en palabras:
 * "lunes, 9 de noviembre de 2026". La fecha se arma con sus partes (no con
 * new Date("2026-11-09"), que se interpreta en UTC) para que la zona horaria no la corra un dia.
 */
export function formatearFecha(valor: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!partes) {
    return valor;
  }
  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  // Si el dia no existe (por ejemplo 2026-02-31) JS lo desplaza al mes siguiente: se devuelve el valor tal cual.
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return valor;
  }
  return FECHA.format(fecha);
}

/** Recibe el valor de un input type="time" ("14:00") y lo devuelve igual, en 24 horas. */
export function formatearHora(valor: string): string {
  const partes = /^(\d{1,2}):(\d{2})/.exec(valor);
  if (!partes) {
    return valor;
  }
  return `${partes[1].padStart(2, '0')}:${partes[2]}`;
}
