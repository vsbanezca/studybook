import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbMessageComponent } from './sb-message.component';

describe('SbMessageComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbMessageComponent], providers: [provideRouter([])] }));

  it('tiene role alert y emite aceptado', () => {
    const f = TestBed.createComponent(SbMessageComponent);
    f.componentRef.setInput('tipo', 'exito');
    f.componentRef.setInput('texto', 'Listo');
    f.detectChanges();
    let emitido = false;
    f.componentInstance.aceptado.subscribe(() => (emitido = true));
    expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    f.nativeElement.querySelector('button').click();
    expect(emitido).toBe(true);
  });
});
