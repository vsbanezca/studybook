import { normalizarTelefono } from './telefono';

describe('telefono', () => {
  it('normaliza quitando espacios, guiones y paréntesis', () => {
    expect(normalizarTelefono('0412-123 4567')).toBe('04121234567');
    expect(normalizarTelefono('+58 412 1234567')).toBe('+584121234567');
    expect(normalizarTelefono('(0412) 1234567')).toBe('04121234567');
    expect(normalizarTelefono(null)).toBe('');
  });
});
