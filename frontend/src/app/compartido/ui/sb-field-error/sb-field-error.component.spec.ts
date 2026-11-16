import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { obligatorio } from '../../validacion/validators';
import { SbCampoDirective, SbFieldErrorComponent } from './sb-field-error.component';

@Component({
  imports: [ReactiveFormsModule, SbFieldErrorComponent, SbCampoDirective],
  template: `
    <input id="nombre" [formControl]="nombre" [sbCampo]="nombre" [sbAyuda]="ayuda()" />
    <sb-field-error [control]="nombre" idMensaje="nombre-error" [mensajes]="{ required: 'El nombre es obligatorio' }" />
  `,
})
class Anfitrion {
  nombre = new FormControl('', obligatorio);
  ayuda = signal<string | null>(null);
}

describe('sb-field-error y sbCampo', () => {
  function abrir() {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, input: el.querySelector('input')!, region: () => el.querySelector('[aria-live="polite"]')! };
  }

  it('en un campo intacto no muestra error y la region ya existe', () => {
    const { region, input } = abrir();
    expect(region()).toBeTruthy();
    expect(region().textContent?.trim()).toBe('');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('al salir del campo muestra icono y texto, aria-invalid y aria-describedby', () => {
    const { fixture, region, input } = abrir();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(region().textContent).toContain('El nombre es obligatorio');
    expect(region().querySelector('sb-icon')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('nombre-error');
    expect(region().querySelector('#nombre-error')).toBeTruthy();
  });

  it('desaparece en cuanto el valor es valido', () => {
    const { fixture, region, input } = abrir();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(region().textContent?.trim()).toBe('');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('conserva el texto de ayuda en aria-describedby', () => {
    const { fixture, input } = abrir();
    fixture.componentInstance.ayuda.set('nombre-ayuda');
    fixture.detectChanges();
    expect(input.getAttribute('aria-describedby')).toBe('nombre-ayuda');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-describedby')).toBe('nombre-error nombre-ayuda');
  });
});
