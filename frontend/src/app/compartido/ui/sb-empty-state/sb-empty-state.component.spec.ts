import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbEmptyStateComponent } from './sb-empty-state.component';

describe('SbEmptyStateComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbEmptyStateComponent], providers: [provideRouter([])] }));

  it('emite accionado al pulsar el boton', () => {
    const f = TestBed.createComponent(SbEmptyStateComponent);
    f.componentRef.setInput('icono', 'calendar');
    f.componentRef.setInput('titulo', 'Vacio');
    f.componentRef.setInput('texto', 'Nada aqui');
    f.componentRef.setInput('accion', 'Crear');
    f.detectChanges();
    let n = 0;
    f.componentInstance.accionado.subscribe(() => n++);
    f.nativeElement.querySelector('button').click();
    expect(n).toBe(1);
  });
});
