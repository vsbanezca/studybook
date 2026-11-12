import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { adminGuard } from '../core/admin.guard';
import { SesionService } from '../core/sesion.service';
import { Espacio } from '../espacios/espacio.model';
import { ConsultarEquipamientoComponent } from './consultar-equipamiento/consultar-equipamiento.component';
import { CrearEquipamientoComponent } from './crear-equipamiento/crear-equipamiento.component';
import { Equipamiento } from './equipamiento.model';
import { EquipamientoService } from './equipamiento.service';

const SALA: Espacio = { id: 1, nombre: 'Sala de estudio 1', ubicacion: 'Biblioteca', piso: '2', capacidad: 6 };
const PROYECTOR: Equipamiento = {
  id: 1, nombre: 'Proyector', categoria: 'Audiovisual', descripcion: 'Proyector HDMI', estado: 'Disponible', cantidad: 3, espacioId: 1,
};

function montar<T>(tipo: Type<T>, rol: 'MIEMBRO' | 'ADMINISTRADOR', id = '1') {
  TestBed.configureTestingModule({
    imports: [tipo],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
    ],
  });
  TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol });
  const fixture = TestBed.createComponent(tipo);
  document.body.appendChild(fixture.nativeElement);
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

const mensaje = () => document.querySelector('sb-dialogo-mensaje');
const panelConfirmar = () => document.querySelector('.sb-modal-panel:not(.sb-modal-mensaje)');
const botonesConfirmar = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.sb-modal-panel button'));

afterEach(() => {
  document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  document.querySelectorAll('app-consultar-equipamiento, app-crear-equipamiento').forEach((n) => n.remove());
});

describe('EquipamientoService', () => {
  it('consulta con GET /api/equipamientos?espacioId= y crea con POST', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const servicio = TestBed.inject(EquipamientoService);
    const http = TestBed.inject(HttpTestingController);
    servicio.consultarPorEspacio(3).subscribe();
    const get = http.expectOne('/api/equipamientos?espacioId=3');
    expect(get.request.method).toBe('GET');
    get.flush([]);
    servicio.crearEquipamiento(PROYECTOR).subscribe();
    const post = http.expectOne('/api/equipamientos');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(PROYECTOR);
    post.flush(PROYECTOR);
  });
});

describe('ConsultarEquipamientoComponent', () => {
  it('muestra el nombre del espacio y la lista de equipamiento', async () => {
    const { fixture, http, el } = montar(ConsultarEquipamientoComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    http.expectOne('/api/equipamientos?espacioId=1').flush([PROYECTOR]);
    await fixture.whenStable();
    expect(el.querySelector('h1')?.textContent).toContain('Equipamiento');
    expect(el.textContent).toContain('Sala de estudio 1');
    expect(el.querySelectorAll('li.tarjeta').length).toBe(1);
    expect(el.textContent).toContain('Proyector');
    expect(el.textContent).toContain('Audiovisual');
    expect(el.textContent).toContain('Disponible');
    expect(el.textContent).toContain('Cantidad: 3');
    expect(el.textContent).toContain('Proyector HDMI');
  });

  it('sin equipamiento muestra el estado vacio con mensaje', async () => {
    const { fixture, http, el } = montar(ConsultarEquipamientoComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    http.expectOne('/api/equipamientos?espacioId=1').flush([]);
    await fixture.whenStable();
    expect(el.querySelector('sb-empty-state')?.textContent).toContain('Este espacio no tiene equipamiento registrado');
    expect(el.querySelectorAll('li.tarjeta').length).toBe(0);
  });

  it('solo el Administrador ve «Agregar equipamiento», que lleva al formulario del espacio', async () => {
    for (const [rol, visible] of [['ADMINISTRADOR', true], ['MIEMBRO', false]] as const) {
      TestBed.resetTestingModule();
      const { fixture, http, el } = montar(ConsultarEquipamientoComponent, rol);
      fixture.detectChanges();
      http.expectOne('/api/espacios').flush([SALA]);
      http.expectOne('/api/equipamientos?espacioId=1').flush([PROYECTOR]);
      await fixture.whenStable();
      const enlace = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Agregar equipamiento'));
      expect(!!enlace).toBe(visible);
      if (enlace) expect(enlace.getAttribute('href')).toBe('/espacios/1/equipamiento/nuevo');
      el.remove();
    }
  });

  it('con un espacio que no esta en la lista avisa con Aceptar y vuelve a Espacios', async () => {
    const { fixture, http } = montar(ConsultarEquipamientoComponent, 'MIEMBRO', '99');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    http.expectNone('/api/equipamientos?espacioId=99');
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('El espacio indicado no existe');
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(navegar).toHaveBeenCalledWith('/espacios');
  });

  it('si el servidor responde 404 para el espacio, avisa con Aceptar', async () => {
    const { fixture, http } = montar(ConsultarEquipamientoComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    http.expectOne('/api/equipamientos?espacioId=1').flush({ mensaje: 'El espacio indicado no existe' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('El espacio indicado no existe');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
  });

  it('si falla la conexion muestra el error del servidor con Aceptar', async () => {
    const { fixture, http } = montar(ConsultarEquipamientoComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('No se pudo conectar con el servidor');
  });
});

describe('CrearEquipamientoComponent', () => {
  const campo = (id: string) => document.querySelector<HTMLInputElement>('#' + id)!;
  const escribir = (id: string, valor: string) => {
    const c = campo(id);
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  const llenar = () => {
    escribir('nombre', 'Proyector');
    escribir('categoria', 'Audiovisual');
    escribir('estado', 'Disponible');
    escribir('cantidad', '3');
    escribir('descripcion', 'Proyector HDMI');
  };

  async function abrir(rol: 'ADMINISTRADOR' | 'MIEMBRO' = 'ADMINISTRADOR') {
    const m = montar(CrearEquipamientoComponent, rol);
    m.fixture.detectChanges();
    m.http.expectOne('/api/espacios').flush([SALA]);
    await m.fixture.whenStable();
    return m;
  }
  const enviar = async (fixture: { whenStable: () => Promise<unknown> }, el: HTMLElement) => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  it('muestra los cuatro campos y el nombre del espacio', async () => {
    const { el } = await abrir();
    ['nombre', 'categoria', 'estado', 'descripcion'].forEach((id) => expect(campo(id)).toBeTruthy());
    expect(el.textContent).toContain('Sala de estudio 1');
  });

  it('con campos vacios muestra los errores con Aceptar y no pide confirmacion', async () => {
    const { fixture, http, el } = await abrir();
    await enviar(fixture, el);
    const texto = mensaje()?.textContent ?? '';
    expect(texto).toContain('Datos proporcionados incorrectos');
    expect(texto).toContain('Nombre: Este campo es obligatorio.');
    expect(texto).toContain('Categoría: Este campo es obligatorio.');
    expect(texto).toContain('Estado: Este campo es obligatorio.');
    expect(texto).toContain('Descripción: Este campo es obligatorio.');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
    expect(panelConfirmar()).toBeNull();
    http.expectNone('/api/equipamientos');
  });

  it('rechaza una cantidad de 0, negativa, decimal o vacia (no numerica) con Aceptar y sin llamar al servidor', async () => {
    const casos: [string, string][] = [
      ['0', 'La cantidad debe ser un número entero mayor o igual a 1'],
      ['-2', 'La cantidad debe ser un número entero mayor o igual a 1'],
      ['2.5', 'La cantidad debe ser un número entero mayor o igual a 1'],
      ['abc', 'Cantidad: Este campo es obligatorio.'],
      ['', 'Cantidad: Este campo es obligatorio.'],
    ];
    const { fixture, http, el } = await abrir();
    for (const [valor, texto] of casos) {
      llenar();
      escribir('cantidad', valor);
      await enviar(fixture, el);
      expect(mensaje()?.textContent, valor).toContain(texto);
      expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
      mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
      await fixture.whenStable();
      expect(campo('nombre').value).toBe('Proyector');
    }
    http.expectNone('/api/equipamientos');
    expect(panelConfirmar()).toBeNull();
  });

  it('pide confirmacion Si o No con el resumen, y No conserva los datos', async () => {
    const { fixture, http, el } = await abrir();
    llenar();
    await enviar(fixture, el);
    const texto = panelConfirmar()?.textContent ?? '';
    expect(texto).toContain('¿Confirmas el registro del equipamiento?');
    expect(texto).toContain('Sala de estudio 1');
    expect(texto).toContain('Proyector');
    expect(texto).toContain('Cantidad');
    expect(botonesConfirmar().map((b) => b.textContent?.trim())).toEqual(['No', 'Sí']);
    botonesConfirmar()[0].click();
    await fixture.whenStable();
    expect(panelConfirmar()).toBeNull();
    expect(campo('nombre').value).toBe('Proyector');
    expect(campo('descripcion').value).toBe('Proyector HDMI');
    http.expectNone('/api/equipamientos');
  });

  it('con Si crea el equipamiento, muestra el exito con Aceptar y vuelve a la lista del espacio', async () => {
    const { fixture, http, el } = await abrir();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    llenar();
    await enviar(fixture, el);
    botonesConfirmar()[1].click();
    const req = http.expectOne('/api/equipamientos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre: 'Proyector', categoria: 'Audiovisual', estado: 'Disponible', cantidad: 3, descripcion: 'Proyector HDMI', espacioId: 1,
    });
    req.flush(PROYECTOR);
    await fixture.whenStable();
    const exito = el.querySelector('sb-message')!;
    expect(exito.textContent).toContain('El equipamiento se ha creado exitosamente');
    exito.querySelector<HTMLButtonElement>('button')!.click();
    expect(navegar).toHaveBeenCalledWith('/espacios/1/equipamiento');
  });

  it('un duplicado muestra el texto del servidor con Aceptar y conserva los datos', async () => {
    const { fixture, http, el } = await abrir();
    llenar();
    await enviar(fixture, el);
    botonesConfirmar()[1].click();
    http.expectOne('/api/equipamientos').flush(
      { mensaje: 'Ya existe ese equipamiento en este espacio', campos: {} },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('Ya existe ese equipamiento en este espacio');
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(mensaje()).toBeNull();
    expect(campo('nombre').value).toBe('Proyector');
  });

  it('un 403 del servidor indica que no tiene permiso', async () => {
    const { fixture, http, el } = await abrir();
    llenar();
    await enviar(fixture, el);
    botonesConfirmar()[1].click();
    http.expectOne('/api/equipamientos').flush({ mensaje: 'x' }, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('No tienes permiso');
  });

  it('un espacio inexistente (400 del servidor) se muestra con Aceptar', async () => {
    const { fixture, http, el } = await abrir();
    llenar();
    await enviar(fixture, el);
    botonesConfirmar()[1].click();
    http.expectOne('/api/equipamientos').flush(
      { mensaje: 'Datos proporcionados incorrectos', campos: { espacioId: 'El espacio indicado no existe' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('El espacio indicado no existe');
  });

  it('con un espacio que no existe avisa y vuelve a Espacios', async () => {
    const m = montar(CrearEquipamientoComponent, 'ADMINISTRADOR', '99');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    m.fixture.detectChanges();
    m.http.expectOne('/api/espacios').flush([SALA]);
    await m.fixture.whenStable();
    expect(mensaje()?.textContent).toContain('El espacio indicado no existe');
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    expect(navegar).toHaveBeenCalledWith('/espacios');
  });
});

describe('guarda de la ruta de agregar equipamiento', () => {
  it('un Miembro no entra por URL directa: vuelve a Espacios', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' });
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(String(resultado)).toBe('/espacios');
  });

  it('el Administrador si entra', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(SesionService).establecer({ nombre: 'Admin', correo: 'a@ucab.edu.ve', rol: 'ADMINISTRADOR' });
    expect(TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never))).toBe(true);
  });
});
