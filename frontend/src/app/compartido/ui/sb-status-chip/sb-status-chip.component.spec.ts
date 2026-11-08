import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbStatusChipComponent } from './sb-status-chip.component';

describe('SbStatusChipComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbStatusChipComponent], providers: [provideRouter([])] }));

  it('muestra texto e icono segun el estado', () => {
    const f = TestBed.createComponent(SbStatusChipComponent);
    f.componentRef.setInput('estado', 'Cancelada');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Cancelada');
    expect(f.nativeElement.querySelector('sb-icon svg')).not.toBeNull();
  });
});
