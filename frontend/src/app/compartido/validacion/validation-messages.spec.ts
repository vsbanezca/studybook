import { FormControl, FormGroup } from '@angular/forms';
import { listarErrores, mensajeDeError, textoCapacidad, textoDeCodigo } from './validation-messages';
import { correoValido, dominioInstitucional, obligatorio } from './validators';

describe('catalogo de mensajes', () => {
  it('sin errores devuelve vacio', () => {
    expect(mensajeDeError(null)).toBe('');
  });

  it('elige el mensaje por prioridad: obligatorio antes que formato', () => {
    expect(mensajeDeError({ correo: true, required: true })).toBe('Este campo es obligatorio.');
  });

  it('un texto propio del campo reemplaza al generico', () => {
    expect(mensajeDeError({ required: true }, { required: 'El correo es obligatorio' })).toBe('El correo es obligatorio');
  });

  it('la capacidad incluye el maximo', () => {
    expect(mensajeDeError({ capacidad: { maximo: 6 } })).toBe('Supera la capacidad del espacio (máximo 6)');
    expect(textoCapacidad(2)).toBe('Supera la capacidad del espacio (máximo 2)');
  });

  it('el error del servidor se muestra tal cual', () => {
    expect(mensajeDeError({ servidor: 'Ya existe una cuenta con ese correo' })).toBe('Ya existe una cuenta con ese correo');
  });

  it('listarErrores sigue el orden del formulario y usa las etiquetas', () => {
    const g = new FormGroup({
      nombre: new FormControl('', obligatorio),
      correo: new FormControl('x@gmail.com', [correoValido, dominioInstitucional]),
      ok: new FormControl('a', obligatorio),
    });
    expect(listarErrores(g, { nombre: 'Nombre', correo: 'Correo', ok: 'Ok' })).toEqual([
      { campo: 'nombre', etiqueta: 'Nombre', texto: 'Este campo es obligatorio.' },
      { campo: 'correo', etiqueta: 'Correo', texto: 'Usa tu correo institucional' },
    ]);
  });

  it('textoDeCodigo traduce los codigos del servidor y deja pasar los textos literales', () => {
    expect(textoDeCodigo('cedula', 'formato')).toBe('La cédula debe tener solo números');
    expect(textoDeCodigo('clave', 'longitud_minima')).toBe('La contraseña debe tener al menos 8 caracteres');
    expect(textoDeCodigo('nombre', 'obligatorio')).toBe('Este campo es obligatorio.');
    expect(textoDeCodigo('correo', 'dominio_no_institucional')).toBe('Usa tu correo institucional');
    expect(textoDeCodigo('correo', 'Ya existe una cuenta con ese correo')).toBe('Ya existe una cuenta con ese correo');
  });
});
