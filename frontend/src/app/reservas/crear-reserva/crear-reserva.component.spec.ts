import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { miembroGuard } from '../../core/admin.guard';
import { SesionService } from '../../core/sesion.service';
import { Espacio } from '../../espacios/espacio.model';
import { ConsultarMisReservasComponent } from '../consultar-mis-reservas/consultar-mis-reservas.component';
import { Reserva } from '../reserva.model';
import { CrearReservaComponent } from './crear-reserva.component';

const SALA: Espacio = { id: 1, nombre: 'Sala de estudio 1', ubicacion: 'Biblioteca', piso: '1', capacidad: 6 };
const CUBICULO: Espacio = { id: 2, nombre: 'Cubículo A', ubicacion: 'Biblioteca', piso: '2', capacidad: 2 };
const FUTURO = '2099-11-15';
const CREADA: Reserva = {
  id: 1, codigo: 'RES-000001', espacioId: 1, espacioNombre: 'Sala de estudio 1', ubicacion: 'Biblioteca',
  fecha: FUTURO, horaInicio: '14:00', horaFin: '15:30', asistentes: 4, estado: 'ACTIVA',
};

const mensaje = () => document.querySelector('sb-dialogo-mensaje');
const panelConfirmar = () => document.querySelector('.sb-modal-panel:not(.sb-modal-mensaje)');
const botonesConfirmar = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.sb-modal-panel button'));
const campo = (id: string) => document.querySelector<HTMLInputElement>('#' + id)!;
const escribir = (id: string, valor: string) => {
  const c = campo(id);
  c.value = valor;
  c.dispatchEvent(new Event('input'));
};
const llenar = (cambios: Record<string, string> = {}) => {
  const v = { fecha: FUTURO, horaInicio: '14:00', horaFin: '15:30', asistentes: '4', ...cambios };
  Object.entries(v).forEach(([id, valor]) => escribir(id, valor));
};

function configurar(rol: 'MIEMBRO' | 'ADMINISTRADOR' = 'MIEMBRO', query: Record<string, string> = {}) {
  TestBed.configureTestingModule({
    imports: [CrearReservaComponent],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
    ],
  });
  TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol });
}

async function abrir(espacios: Espacio[] = [SALA, CUBICULO], query: Record<string, string> = {}) {
  configurar('MIEMBRO', query);
  const fixture = TestBed.createComponent(CrearReservaComponent);
  document.body.appendChild(fixture.nativeElement);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne('/api/espacios').flush(espacios);
  await fixture.whenStable();
  const el = fixture.nativeElement as HTMLElement;
  const elegirSala = async () => {
    el.querySelector<HTMLElement>('sb-space-card')!.click();
    await fixture.whenStable();
  };
  const reservar = async () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const aceptarMensaje = async () => {
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
  };
  return { fixture, http, el, elegirSala, reservar, aceptarMensaje };
}

afterEach(() => {
  document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  document.querySelectorAll('app-crear-reserva').forEach((n) => n.remove());
});

describe('CrearReservaComponent: pantalla', () => {
  it('muestra la lista de espacios como tarjetas seleccionables y el formulario debajo', async () => {
    const { el } = await abrir();
    expect(el.querySelectorAll('sb-space-card').length).toBe(2);
    expect(el.querySelector('sb-space-card')?.getAttribute('role')).toBe('radio');
    ['fecha', 'horaInicio', 'horaFin', 'asistentes'].forEach((id) => expect(campo(id)).toBeTruthy());
    expect(campo('fecha').type).toBe('date');
    expect(campo('horaInicio').type).toBe('time');
    expect(campo('horaFin').type).toBe('time');
    const botones = [...el.querySelectorAll('form .sb-btn')].map((b) => b.textContent?.trim());
    expect(botones).toEqual(['Cancelar', 'Reservar']);
  });

  it('preselecciona el espacio que llega en la ruta', async () => {
    const { el } = await abrir([SALA, CUBICULO], { espacioId: '2' });
    const tarjetas = el.querySelectorAll('sb-space-card');
    expect(tarjetas[1].getAttribute('aria-checked')).toBe('true');
    expect(tarjetas[0].getAttribute('aria-checked')).toBe('false');
  });

  it('sin espacios informa «No hay espacios registrados» con Aceptar y regresa a Mis reservas', async () => {
    configurar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CrearReservaComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/espacios').flush([]);
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('No hay espacios registrados');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    expect(navegar).toHaveBeenCalledWith('/mis-reservas');
  });
});

describe('CrearReservaComponent: validacion', () => {
  it('con todo vacio muestra «Datos proporcionados incorrectos» con cada campo y Aceptar, sin llamar al servidor', async () => {
    const { http, reservar } = await abrir();
    await reservar();
    const texto = mensaje()?.textContent ?? '';
    expect(texto).toContain('Datos proporcionados incorrectos');
    expect(texto).toContain('Espacio: Selecciona un espacio');
    expect(texto).toContain('Fecha: Este campo es obligatorio.');
    expect(texto).toContain('Hora de inicio: Este campo es obligatorio.');
    expect(texto).toContain('Hora de fin: Este campo es obligatorio.');
    expect(texto).toContain('Asistentes: Este campo es obligatorio.');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
    http.expectNone('/api/reservas/validar');
  });

  it('rechaza fecha pasada, fin no posterior y asistentes menores que 1, con los datos conservados', async () => {
    const { http, elegirSala, reservar, aceptarMensaje } = await abrir();
    await elegirSala();
    llenar({ fecha: '2000-01-01', horaInicio: '16:00', horaFin: '15:00', asistentes: '0' });
    await reservar();
    const texto = mensaje()?.textContent ?? '';
    expect(texto).toContain('La fecha no puede estar en el pasado');
    expect(texto).toContain('La hora de fin debe ser posterior a la hora de inicio');
    expect(texto).toContain('número entero mayor o igual a 1');
    await aceptarMensaje();
    expect(mensaje()).toBeNull();
    expect(campo('horaInicio').value).toBe('16:00');
    expect(campo('asistentes').value).toBe('0');
    expect(document.activeElement).toBe(campo('fecha'));
    http.expectNone('/api/reservas/validar');
  });

  it('muestra literal la capacidad excedida del servidor, con Aceptar y datos conservados', async () => {
    const { http, elegirSala, reservar, aceptarMensaje } = await abrir();
    await elegirSala();
    llenar({ asistentes: '9' });
    await reservar();
    http.expectOne('/api/reservas/validar').flush(
      { mensaje: 'La cantidad de asistentes supera la capacidad del espacio', campos: { asistentes: 'La cantidad de asistentes supera la capacidad del espacio' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await new Promise((r) => setTimeout(r));
    expect(mensaje()?.textContent).toContain('La cantidad de asistentes supera la capacidad del espacio');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
    expect(panelConfirmar()).toBeNull();
    await aceptarMensaje();
    expect(campo('asistentes').value).toBe('9');
    expect(document.activeElement).toBe(campo('asistentes'));
  });

  it('muestra literal «El espacio ya está reservado en esa fecha y horario» (409) con Aceptar y datos conservados', async () => {
    const { http, elegirSala, reservar, aceptarMensaje } = await abrir();
    await elegirSala();
    llenar();
    await reservar();
    http.expectOne('/api/reservas/validar').flush(
      { mensaje: 'El espacio ya está reservado en esa fecha y horario', campos: { fecha: 'x' } },
      { status: 409, statusText: 'Conflict' },
    );
    await new Promise((r) => setTimeout(r));
    expect(mensaje()?.textContent).toContain('El espacio ya está reservado en esa fecha y horario');
    await aceptarMensaje();
    expect(campo('fecha').value).toBe(FUTURO);
    expect(campo('horaFin').value).toBe('15:30');
  });

  it('muestra los errores de campo de un 400 genérico con la etiqueta del campo', async () => {
    const { http, elegirSala, reservar } = await abrir();
    await elegirSala();
    llenar();
    await reservar();
    http.expectOne('/api/reservas/validar').flush(
      { mensaje: 'Datos proporcionados incorrectos', campos: { horaFin: 'La hora no es válida' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await new Promise((r) => setTimeout(r));
    expect(mensaje()?.textContent).toContain('Datos proporcionados incorrectos');
    expect(mensaje()?.textContent).toContain('Hora de fin: La hora no es válida');
  });
});

describe('CrearReservaComponent: confirmacion', () => {
  async function hastaConfirmar() {
    const m = await abrir();
    await m.elegirSala();
    llenar();
    await m.reservar();
    m.http.expectOne('/api/reservas/validar').flush({ valida: true });
    await m.fixture.whenStable();
    return m;
  }

  it('pide confirmar con el espacio, la fecha sin ambigüedad, el horario y los asistentes', async () => {
    await hastaConfirmar();
    const texto = panelConfirmar()?.textContent ?? '';
    expect(texto).toContain('¿Confirmas la reserva?');
    expect(texto).toContain('Sala de estudio 1');
    expect(texto).toContain('15 de noviembre de 2099');
    expect(texto).toContain('14:00 a 15:30');
    expect(texto).toContain('4');
    expect(botonesConfirmar().map((b) => b.textContent?.trim())).toEqual(['No', 'Sí']);
  });

  it('No no registra y vuelve al formulario con los datos conservados', async () => {
    const { http, fixture } = await hastaConfirmar();
    botonesConfirmar()[0].click();
    await fixture.whenStable();
    expect(panelConfirmar()).toBeNull();
    http.expectNone('/api/reservas');
    expect(campo('fecha').value).toBe(FUTURO);
    expect(campo('asistentes').value).toBe('4');
  });

  it('Esc no registra', async () => {
    const { http, fixture } = await hastaConfirmar();
    document.querySelector('.cdk-dialog-container')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();
    expect(panelConfirmar()).toBeNull();
    http.expectNone('/api/reservas');
    expect(campo('horaInicio').value).toBe('14:00');
  });

  it('clic afuera no registra', async () => {
    const { http, fixture } = await hastaConfirmar();
    document.querySelector<HTMLElement>('.sb-modal-fondo')!.click();
    await fixture.whenStable();
    expect(panelConfirmar()).toBeNull();
    http.expectNone('/api/reservas');
    expect(campo('horaFin').value).toBe('15:30');
  });

  it('Sí registra con los datos del formulario, muestra el éxito con Aceptar y Aceptar vuelve a Mis reservas', async () => {
    const { http, fixture, el } = await hastaConfirmar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    botonesConfirmar()[1].click();
    const req = http.expectOne('/api/reservas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ espacioId: 1, fecha: FUTURO, horaInicio: '14:00', horaFin: '15:30', asistentes: 4 });
    req.flush(CREADA, { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    const exito = el.querySelector('sb-message')!;
    expect(exito.textContent).toContain('La reserva se ha creado exitosamente');
    expect(navegar).not.toHaveBeenCalled();
    exito.querySelector<HTMLButtonElement>('button')!.click();
    expect(navegar).toHaveBeenCalledWith('/mis-reservas');
  });

  it('si al confirmar el servidor detecta un choque (409), lo muestra con Aceptar y conserva los datos', async () => {
    const { http, fixture, aceptarMensaje } = await hastaConfirmar();
    botonesConfirmar()[1].click();
    http.expectOne('/api/reservas').flush(
      { mensaje: 'El espacio ya está reservado en esa fecha y horario', campos: {} },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('El espacio ya está reservado en esa fecha y horario');
    await aceptarMensaje();
    expect(campo('fecha').value).toBe(FUTURO);
  });

  it('Cancelar descarta los datos y vuelve a Mis reservas sin llamar al servidor', async () => {
    const { http, el } = await abrir();
    llenar();
    const cancelar = [...el.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Cancelar')!;
    expect(cancelar.getAttribute('href')).toBe('/mis-reservas');
    http.expectNone('/api/reservas');
    http.expectNone('/api/reservas/validar');
  });
});

describe('Crear reserva: flujo completo', () => {
  it('flujo feliz en 5 interacciones y la reserva nueva se ve en Mis reservas', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'reservas/nueva', canActivate: [miembroGuard], component: CrearReservaComponent },
          { path: 'mis-reservas', component: ConsultarMisReservasComponent },
          { path: 'espacios', component: ConsultarMisReservasComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' });
    const http = TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reservas/nueva');
    http.expectOne('/api/espacios').flush([SALA, CUBICULO]);
    await harness.fixture.whenStable();
    const el = harness.routeNativeElement as HTMLElement;
    let interacciones = 0;

    // 1. Selecciona el espacio
    el.querySelector<HTMLElement>('sb-space-card')!.click();
    interacciones++;
    // 2. Ingresa los datos
    llenar();
    interacciones++;
    // 3. Presiona Reservar
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    interacciones++;
    http.expectOne('/api/reservas/validar').flush({ valida: true });
    await harness.fixture.whenStable();
    // 4. Responde la confirmacion (Sí)
    botonesConfirmar()[1].click();
    interacciones++;
    http.expectOne('/api/reservas').flush(CREADA, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    // 5. Confirma lectura (Aceptar)
    el.querySelector('sb-message')!.querySelector<HTMLButtonElement>('button')!.click();
    interacciones++;
    await harness.fixture.whenStable();

    expect(interacciones).toBe(5);
    expect(TestBed.inject(Router).url).toBe('/mis-reservas');
    http.expectOne('/api/reservas/mias').flush([CREADA]);
    await harness.fixture.whenStable();
    const pantalla = harness.routeNativeElement as HTMLElement;
    expect(pantalla.textContent).toContain('Sala de estudio 1');
    expect(pantalla.textContent).toContain('Código RES-000001');
    expect(pantalla.textContent).toContain('De 14:00 a 15:30');
    expect(pantalla.textContent).toContain('Activa');
  });
});

describe('Crear reserva: acceso por rol', () => {
  it('el Administrador no entra a la pantalla: vuelve a Espacios', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(SesionService).establecer({ nombre: 'Admin', correo: 'a@ucab.edu.ve', rol: 'ADMINISTRADOR' });
    const resultado = TestBed.runInInjectionContext(() => miembroGuard({} as never, {} as never));
    expect(String(resultado)).toBe('/espacios');
  });

  it('sin sesión va a Iniciar sesión y el Miembro sí entra', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    expect(String(TestBed.runInInjectionContext(() => miembroGuard({} as never, {} as never)))).toBe('/iniciar-sesion');
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' });
    expect(TestBed.runInInjectionContext(() => miembroGuard({} as never, {} as never))).toBe(true);
  });
});
