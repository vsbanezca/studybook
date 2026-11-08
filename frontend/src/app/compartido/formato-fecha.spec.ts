import { formatearFecha, formatearHora } from './formato-fecha';

describe('formatearFecha', () => {
  it('escribe la fecha en palabras', () => {
    expect(formatearFecha('2026-11-09')).toBe('lunes, 9 de noviembre de 2026');
  });

  it('no corre de dia una fecha de fin de mes', () => {
    expect(formatearFecha('2026-11-30')).toBe('lunes, 30 de noviembre de 2026');
    expect(formatearFecha('2026-12-31')).toBe('jueves, 31 de diciembre de 2026');
    expect(formatearFecha('2026-03-01')).toBe('domingo, 1 de marzo de 2026');
  });

  it('devuelve el valor tal cual si no es una fecha valida', () => {
    expect(formatearFecha('')).toBe('');
    expect(formatearFecha('2026-02-31')).toBe('2026-02-31');
  });
});

describe('formatearHora', () => {
  it('devuelve la hora en 24 horas', () => {
    expect(formatearHora('14:00')).toBe('14:00');
    expect(formatearHora('09:30')).toBe('09:30');
  });
});
