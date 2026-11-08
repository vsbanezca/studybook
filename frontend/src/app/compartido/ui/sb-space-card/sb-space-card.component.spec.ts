import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbSpaceCardComponent } from './sb-space-card.component';

describe('SbSpaceCardComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbSpaceCardComponent], providers: [provideRouter([])] }));

  it('en modo ver no tiene boton Reservar', () => {
    const f = TestBed.createComponent(SbSpaceCardComponent);
    f.componentRef.setInput('espacio', { nombre: 'Sala 1', ubicacion: 'Biblioteca', piso: 2, capacidad: 6 });
    f.componentRef.setInput('modo', 'ver');
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('Reservar');
    expect(f.nativeElement.textContent).toContain('Ver equipamiento');
  });
});
