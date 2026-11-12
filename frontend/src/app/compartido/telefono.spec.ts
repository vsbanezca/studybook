import { FormControl } from '@angular/forms';
import { normalizarTelefono, telefonoValidator, telefonoValido } from './telefono';

describe('telefono', () => {
  it('normaliza quitando espacios, guiones y paréntesis', () => {
    expect(normalizarTelefono('0412-123 4567')).toBe('04121234567');
    expect(normalizarTelefono('+58 412 1234567')).toBe('+584121234567');
    expect(normalizarTelefono('(0412) 1234567')).toBe('04121234567');
    expect(normalizarTelefono(null)).toBe('');
  });

  it('valida el valor ya normalizado', () => {
    expect(telefonoValido('0412-123 4567')).toBe(true);
    expect(telefonoValido('+58 412 1234567')).toBe(true);
    expect(telefonoValido('(0412) 1234567')).toBe(true);
    expect(telefonoValido('0412-123a567')).toBe(false);
    expect(telefonoValido('0412 123')).toBe(false);
    expect(telefonoValido('1234567890123456')).toBe(false);
    expect(telefonoValido('')).toBe(false);
  });

  it('el validador deja el vacío a required y marca el formato con la clave telefono', () => {
    expect(telefonoValidator(new FormControl(''))).toBeNull();
    expect(telefonoValidator(new FormControl('0412-123 4567'))).toBeNull();
    expect(telefonoValidator(new FormControl('abc'))).toEqual({ telefono: true });
  });
});
