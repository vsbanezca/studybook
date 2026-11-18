import { DestroyRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ahoraEnZona, bytesMaximos, correoValido, dentroDeCapacidad, dominioInstitucional, enteroMinimo, fechaNoPasada,
  horaFinPosterior, horaInicioNoPasada, largoMinimo, marcarErrorServidor, mostrarError, obligatorio, revalidarAlCambiar, soloDigitos,
} from './validators';

const control = (valor: unknown) => new FormControl(valor);
// 15 de noviembre de 2026, 14:30 en Caracas (UTC-4) = 18:30 UTC
const RELOJ = () => new Date('2026-11-15T18:30:00Z');

function grupoReserva() {
  return new FormGroup({
    fecha: new FormControl(''),
    horaInicio: new FormControl(''),
    horaFin: new FormControl(''),
    asistentes: new FormControl<number | null>(null),
    espacio: new FormControl<{ capacidad: number } | null>(null),
  });
}

describe('validadores reutilizables', () => {
  it('obligatorio rechaza nulo, vacio y solo espacios, y acepta 0', () => {
    expect(obligatorio(control(null))).toEqual({ required: true });
    expect(obligatorio(control(''))).toEqual({ required: true });
    expect(obligatorio(control('   '))).toEqual({ required: true });
    expect(obligatorio(control(0))).toBeNull();
    expect(obligatorio(control('a'))).toBeNull();
  });

  it('correoValido exige formato y deja pasar el vacio', () => {
    expect(correoValido(control(''))).toBeNull();
    expect(correoValido(control('ana@ucab.edu.ve'))).toBeNull();
    expect(correoValido(control('ana@ucab'))).toEqual({ correo: true });
    expect(correoValido(control('ana ucab.edu.ve'))).toEqual({ correo: true });
  });

  it('dominioInstitucional exige el dominio completo y no se activa si el formato es invalido', () => {
    expect(dominioInstitucional(control('ana@ucab.edu.ve'))).toBeNull();
    expect(dominioInstitucional(control('Ana@EST.UCAB.EDU.VE'))).toBeNull();
    expect(dominioInstitucional(control('ana@gmail.com'))).toEqual({ dominio: true });
    expect(dominioInstitucional(control('ana@fakeucab.edu.ve'))).toEqual({ dominio: true });
    expect(dominioInstitucional(control('ana@ucab.edu.ve.evil.com'))).toEqual({ dominio: true });
    expect(dominioInstitucional(control('sin-arroba'))).toBeNull();
  });

  it('soloDigitos', () => {
    expect(soloDigitos(control(''))).toBeNull();
    expect(soloDigitos(control('12345678'))).toBeNull();
    expect(soloDigitos(control('12a'))).toEqual({ digitos: true });
  });

  it('largoMinimo cuenta caracteres sin recortar espacios', () => {
    expect(largoMinimo(8)(control(''))).toBeNull();
    expect(largoMinimo(8)(control('1234567'))).not.toBeNull();
    expect(largoMinimo(8)(control('12345678'))).toBeNull();
    expect(largoMinimo(8)(control('1234 567'))).toBeNull();
  });

  it('bytesMaximos cuenta bytes UTF-8, no caracteres', () => {
    expect(bytesMaximos(72)(control('a'.repeat(72)))).toBeNull();
    expect(bytesMaximos(72)(control('a'.repeat(73)))).not.toBeNull();
    expect(bytesMaximos(72)(control('ñ'.repeat(36)))).toBeNull();
    expect(bytesMaximos(72)(control('ñ'.repeat(37)))).not.toBeNull();
  });

  it('enteroMinimo acepta enteros desde el minimo y rechaza decimales, 0 y negativos', () => {
    const v = enteroMinimo(1);
    expect(v(control(null))).toBeNull();
    expect(v(control(1))).toBeNull();
    expect(v(control('7'))).toBeNull();
    expect(v(control(0))).toEqual({ entero: { minimo: 1 } });
    expect(v(control(-3))).not.toBeNull();
    expect(v(control(2.5))).not.toBeNull();
  });

  it('ahoraEnZona usa America/Caracas y no la zona del navegador', () => {
    expect(ahoraEnZona(RELOJ)).toEqual({ fecha: '2026-11-15', hora: '14:30' });
    // 01:00 UTC del 16 sigue siendo el 15 a las 21:00 en Caracas
    expect(ahoraEnZona(() => new Date('2026-11-16T01:00:00Z'))).toEqual({ fecha: '2026-11-15', hora: '21:00' });
  });

  it('fechaNoPasada rechaza ayer y acepta hoy y manana', () => {
    const v = fechaNoPasada(RELOJ);
    expect(v(control('2026-11-14'))).toEqual({ fechaPasada: true });
    expect(v(control('2026-11-15'))).toBeNull();
    expect(v(control('2026-11-16'))).toBeNull();
    expect(v(control(''))).toBeNull();
  });

  it('horaInicioNoPasada solo aplica si la fecha es hoy y acepta la hora igual a la actual', () => {
    const g = grupoReserva();
    g.controls.horaInicio.setValidators(horaInicioNoPasada('fecha', RELOJ));
    g.controls.fecha.setValue('2026-11-15');
    g.controls.horaInicio.setValue('14:29');
    expect(g.controls.horaInicio.errors).toEqual({ horaPasada: true });
    g.controls.horaInicio.setValue('14:30');
    expect(g.controls.horaInicio.errors).toBeNull();
    g.controls.fecha.setValue('2026-11-16');
    g.controls.horaInicio.setValue('08:00');
    expect(g.controls.horaInicio.errors).toBeNull();
  });

  it('horaFinPosterior exige fin mayor que inicio', () => {
    const g = grupoReserva();
    g.controls.horaFin.setValidators(horaFinPosterior('horaInicio'));
    g.controls.horaInicio.setValue('10:00');
    g.controls.horaFin.setValue('10:00');
    expect(g.controls.horaFin.errors).toEqual({ finNoPosterior: true });
    g.controls.horaFin.setValue('09:00');
    expect(g.controls.horaFin.errors).toEqual({ finNoPosterior: true });
    g.controls.horaFin.setValue('10:01');
    expect(g.controls.horaFin.errors).toBeNull();
  });

  it('dentroDeCapacidad compara con la capacidad del espacio elegido', () => {
    const g = grupoReserva();
    g.controls.asistentes.setValidators(dentroDeCapacidad('espacio'));
    g.controls.asistentes.setValue(7);
    expect(g.controls.asistentes.errors).toBeNull(); // sin espacio no hay contra que comparar
    g.controls.espacio.setValue({ capacidad: 6 });
    g.controls.asistentes.updateValueAndValidity();
    expect(g.controls.asistentes.errors).toEqual({ capacidad: { maximo: 6 } });
    g.controls.asistentes.setValue(6);
    expect(g.controls.asistentes.errors).toBeNull();
  });

  it('mostrarError: nunca en un campo intacto, si despues de tocarlo', () => {
    const c = new FormControl('', obligatorio);
    expect(mostrarError(c)).toBe(false);
    c.markAsTouched();
    expect(mostrarError(c)).toBe(true);
    c.setValue('x');
    expect(mostrarError(c)).toBe(false);
  });

  it('marcarErrorServidor marca el campo y el error desaparece al editarlo', () => {
    const c = new FormControl('ana@ucab.edu.ve', obligatorio);
    marcarErrorServidor(c, 'Ya existe una cuenta con ese correo');
    expect(mostrarError(c)).toBe(true);
    c.setValue('otra@ucab.edu.ve');
    expect(c.valid).toBe(true);
  });
});

describe('revalidarAlCambiar', () => {
  const destroyRef = () => TestBed.runInInjectionContext(() => inject(DestroyRef));

  it('reevalua el destino cuando cambia el origen y lo marca tocado si ya tenia valor', () => {
    const g = grupoReserva();
    g.controls.asistentes.setValidators(dentroDeCapacidad('espacio'));
    revalidarAlCambiar(g.controls.espacio, g.controls.asistentes, destroyRef());
    g.controls.espacio.setValue({ capacidad: 10 });
    g.controls.asistentes.setValue(8);
    expect(g.controls.asistentes.errors).toBeNull();
    g.controls.espacio.setValue({ capacidad: 4 });
    expect(g.controls.asistentes.errors).toEqual({ capacidad: { maximo: 4 } });
    expect(g.controls.asistentes.touched).toBe(true);
  });

  it('no marca como tocado un destino vacio', () => {
    const g = new FormGroup({ origen: new FormControl(''), destino: new FormControl('') });
    revalidarAlCambiar(g.controls.origen, g.controls.destino, destroyRef());
    g.controls.origen.setValue('x');
    expect(g.controls.destino.touched).toBe(false);
  });
});
