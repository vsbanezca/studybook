import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ConsultarMisReservasComponent } from './consultar-mis-reservas/consultar-mis-reservas.component';
import { Reserva } from './reserva.model';
import { ReservaService } from './reserva.service';

const RESERVA: Reserva = {
  id: 1,
  espacioNombre: 'Sala de estudio 1',
  ubicacion: 'Biblioteca',
  fecha: '2026-11-16',
  horaInicio: '14:00',
  horaFin: '15:30',
  asistentes: 4,
  estado: 'ACTIVA',
};

function montar() {
  TestBed.configureTestingModule({
    imports: [ConsultarMisReservasComponent],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(ConsultarMisReservasComponent);
  document.body.appendChild(fixture.nativeElement);
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

afterEach(() => document.querySelectorAll('app-consultar-mis-reservas').forEach((n) => n.remove()));

describe('ReservaService', () => {
  it('lista mis reservas con GET /api/reservas/mias', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    let recibido: Reserva[] = [];
    TestBed.inject(ReservaService).listarMisReservas().subscribe((r) => (recibido = r));
    const req = TestBed.inject(HttpTestingController).expectOne('/api/reservas/mias');
    expect(req.request.method).toBe('GET');
    req.flush([RESERVA]);
    expect(recibido).toEqual([RESERVA]);
  });
});

describe('ConsultarMisReservasComponent', () => {
  it('muestra cada reserva con su estado, fecha y horario, sin separador | ni emojis', async () => {
    const { fixture, http, el } = montar();
    fixture.detectChanges();
    http.expectOne('/api/reservas/mias').flush([RESERVA, { ...RESERVA, id: 2, estado: 'CANCELADA' }]);
    await fixture.whenStable();
    expect(el.querySelectorAll('li.tarjeta').length).toBe(2);
    expect(el.textContent).toContain('Sala de estudio 1');
    expect(el.textContent).toContain('Activa');
    expect(el.textContent).toContain('Cancelada');
    expect(el.textContent).toContain('De 14:00 a 15:30');
    expect(el.textContent).toContain('4 asistentes');
    expect(el.textContent).not.toContain('|');
    expect(el.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('sin reservas muestra el estado vacio con mensaje', async () => {
    const { fixture, http, el } = montar();
    fixture.detectChanges();
    http.expectOne('/api/reservas/mias').flush([]);
    await fixture.whenStable();
    expect(el.querySelector('sb-empty-state')?.textContent).toContain('Aún no tienes reservas');
    expect(el.querySelectorAll('li.tarjeta').length).toBe(0);
  });

  it('si falla la carga muestra el error con Aceptar y Aceptar lo cierra', async () => {
    const { fixture, http, el } = montar();
    fixture.detectChanges();
    http.expectOne('/api/reservas/mias').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const aviso = el.querySelector('sb-message')!;
    expect(aviso.textContent).toContain('No se pudo cargar la información');
    aviso.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('sb-message')).toBeNull();
  });

  it('Crear reserva navega a la pantalla de reserva', async () => {
    const { fixture, http, el } = montar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    http.expectOne('/api/reservas/mias').flush([RESERVA]);
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.encabezado button')!.click();
    expect(navegar).toHaveBeenCalledWith('/reservas/nueva');
  });
});
