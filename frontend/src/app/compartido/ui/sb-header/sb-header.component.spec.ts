import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbHeaderComponent } from './sb-header.component';

describe('SbHeaderComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbHeaderComponent], providers: [provideRouter([])] }));

  it('sin sesion y sin rutas no muestra enlaces', () => {
    const f = TestBed.createComponent(SbHeaderComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('a').length).toBe(0);
  });

  it('miembro con todas las rutas muestra 2 enlaces', () => {
    const f = TestBed.createComponent(SbHeaderComponent);
    f.componentRef.setInput('rol', 'miembro');
    f.componentRef.setInput('soloRutasExistentes', false);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('a').length).toBe(2);
  });
});
