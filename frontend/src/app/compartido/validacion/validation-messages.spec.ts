import { FormControl, FormGroup } from '@angular/forms';
import { listarErrores, mensajeDeError, textoCapacidad, textoDeCodigo, textoDeMensaje } from './validation-messages';
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

  it('textoDeCodigo traduce los codigos de formato del servidor', () => {
    expect(textoDeCodigo('cedula', 'formato')).toBe('La cédula debe tener solo números');
    expect(textoDeCodigo('clave', 'longitud_minima')).toBe('La contraseña debe tener al menos 8 caracteres');
    expect(textoDeCodigo('nombre', 'obligatorio')).toBe('Este campo es obligatorio.');
    expect(textoDeCodigo('correo', 'dominio_no_institucional')).toBe('Usa tu correo institucional');
  });

  it('textoDeCodigo traduce los codigos de las reglas de negocio', () => {
    expect(textoDeCodigo('correo', 'correo_registrado')).toBe('Ya existe una cuenta con ese correo');
    expect(textoDeCodigo('cedula', 'cedula_registrada')).toBe('Ya existe una cuenta con esa cédula');
    expect(textoDeCodigo('nombre', 'espacio_repetido')).toBe('Ya existe un espacio con ese nombre en esa ubicación');
    expect(textoDeCodigo('espacioId', 'espacio_no_existe')).toBe('El espacio indicado no existe');
    expect(textoDeCodigo('nombre', 'equipamiento_repetido')).toBe('Ya existe ese equipamiento en este espacio');
    expect(textoDeCodigo('asistentes', 'capacidad_excedida')).toBe('La cantidad de asistentes supera la capacidad del espacio');
    expect(textoDeCodigo('fecha', 'no_disponible')).toBe('El espacio ya está reservado en esa fecha y horario');
  });

  it('un codigo desconocido no se muestra en crudo: usa el texto generico', () => {
    expect(textoDeCodigo('nombre', 'codigo_nuevo')).toBe('Datos proporcionados incorrectos');
    expect(textoDeMensaje('codigo_nuevo')).toBe('Datos proporcionados incorrectos');
    expect(textoDeMensaje(undefined)).toBe('Datos proporcionados incorrectos');
  });

  it('textoDeMensaje traduce el codigo general de la respuesta para el titulo', () => {
    expect(textoDeMensaje('datos_invalidos')).toBe('Datos proporcionados incorrectos');
    expect(textoDeMensaje('sin_permiso')).toBe('No tienes permiso para ver esta página');
    expect(textoDeMensaje('credenciales_incorrectas')).toBe('Correo o contraseña incorrectos');
    expect(textoDeMensaje('sesion_requerida')).toBe('Debes iniciar sesión');
    expect(textoDeMensaje('equipamiento_repetido')).toBe('Ya existe ese equipamiento en este espacio');
  });
});
