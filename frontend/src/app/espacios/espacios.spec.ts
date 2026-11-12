import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SesionService } from '../core/sesion.service';
import { ConsultarEspaciosComponent } from './consultar-espacios/consultar-espacios.component';
import { CrearEspacioComponent } from './crear-espacio/crear-espacio.component';
import { Espacio } from './espacio.model';

const SALA: Espacio = { id: 1, nombre: 'Sala de estudio 3', ubicacion: 'Biblioteca', piso: '2', capacidad: 6 };

function montar<T>(tipo: Type<T>, rol: 'MIEMBRO' | 'ADMINISTRADOR' | null) {
  TestBed.configureTestingModule({
    imports: [tipo],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });
  if (rol) {
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol });
  }
  const fixture = TestBed.createComponent(tipo);
  document.body.appendChild(fixture.nativeElement);
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

const modal = (selector: string) => document.querySelector(selector);

afterEach(() => {
  document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  document.querySelectorAll('app-consultar-espacios, app-crear-espacio').forEach((n) => n.remove());
});

describe('ConsultarEspaciosComponent', () => {
  it('lista los espacios en tarjetas', async () => {
    const { fixture, http, el } = montar(ConsultarEspaciosComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    await fixture.whenStable();
    expect(el.querySelectorAll('sb-space-card').length).toBe(1);
    expect(el.textContent).toContain('Sala de estudio 3');
    expect(el.textContent).toContain('Biblioteca');
    expect(el.textContent).toContain('Piso 2');
  });

  it('sin espacios muestra el estado vacio', async () => {
    const { fixture, http, el } = montar(ConsultarEspaciosComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([]);
    await fixture.whenStable();
    expect(el.textContent).toContain('No hay espacios registrados');
    expect(el.querySelector('sb-space-card')).toBeNull();
  });

  it('el Administrador ve Crear espacio y el Miembro no', async () => {
    for (const [rol, visible] of [['ADMINISTRADOR', true], ['MIEMBRO', false]] as const) {
      TestBed.resetTestingModule();
      const { fixture, http, el } = montar(ConsultarEspaciosComponent, rol);
      fixture.detectChanges();
      http.expectOne('/api/espacios').flush([SALA]);
      await fixture.whenStable();
      const enlace = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('Crear espacio'));
      expect(!!enlace).toBe(visible);
      if (enlace) expect(enlace.getAttribute('href')).toBe('/espacios/nuevo');
      el.remove();
    }
  });

  it('«Reservar» se ve solo para el Miembro; «Ver equipamiento» para ambos', async () => {
    for (const [rol, reservar] of [['MIEMBRO', true], ['ADMINISTRADOR', false]] as const) {
      TestBed.resetTestingModule();
      const { fixture, http, el } = montar(ConsultarEspaciosComponent, rol);
      fixture.detectChanges();
      http.expectOne('/api/espacios').flush([SALA]);
      await fixture.whenStable();
      const botones = [...el.querySelectorAll('sb-space-card button')].map((b) => b.textContent?.trim() ?? '');
      expect(botones.some((t) => t.startsWith('Ver equipamiento'))).toBe(true);
      expect(botones.includes('Reservar')).toBe(reservar);
      el.remove();
    }
  });

  it('«Ver equipamiento» navega a la pantalla de equipamiento del espacio', async () => {
    const { fixture, http, el } = montar(ConsultarEspaciosComponent, 'MIEMBRO');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    await fixture.whenStable();
    const ver = [...el.querySelectorAll<HTMLButtonElement>('sb-space-card button')].find((b) => b.textContent?.includes('Ver equipamiento'))!;
    ver.click();
    expect(navegar).toHaveBeenCalledWith(['/espacios', 1, 'equipamiento']);
  });

  it('el texto de apoyo del Administrador no habla de reservar', async () => {
    const { fixture, http, el } = montar(ConsultarEspaciosComponent, 'ADMINISTRADOR');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush([SALA]);
    await fixture.whenStable();
    expect(el.querySelector('.texto-apoyo')?.textContent).not.toContain('reservarlo');
  });

  it('si falla la carga muestra un mensaje con Aceptar', async () => {
    const { fixture, http } = montar(ConsultarEspaciosComponent, 'MIEMBRO');
    fixture.detectChanges();
    http.expectOne('/api/espacios').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(modal('sb-dialogo-mensaje')?.textContent).toContain('No se pudo conectar con el servidor');
    expect(modal('sb-dialogo-mensaje button')?.textContent).toContain('Aceptar');
  });
});

describe('CrearEspacioComponent', () => {
  let fixture: ComponentFixture<CrearEspacioComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const campo = (id: string) => el.querySelector<HTMLInputElement>('#' + id)!;
  const escribir = (id: string, valor: string) => {
    const c = campo(id);
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  const llenar = () => {
    escribir('nombre', 'Sala 5');
    escribir('ubicacion', 'Ingeniería');
    escribir('piso', '3');
    escribir('capacidad', '8');
  };
  const enviar = async () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const botonModal = (texto: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('.cdk-overlay-container button')].find((b) => b.textContent?.trim() === texto)!;

  beforeEach(async () => {
    ({ fixture, http, el } = montar(CrearEspacioComponent, 'ADMINISTRADOR'));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('muestra los campos del espacio con sus etiquetas', () => {
    for (const id of ['nombre', 'ubicacion', 'piso', 'descripcion', 'capacidad']) {
      expect(el.querySelector(`label[for="${id}"]`)).not.toBeNull();
      expect(campo(id)).not.toBeNull();
    }
    expect(el.querySelector('h1')?.textContent).toContain('Crear espacio');
  });

  it('con datos invalidos muestra el error con Aceptar y no pide confirmacion', async () => {
    await enviar();
    const m = modal('sb-dialogo-mensaje');
    expect(m?.textContent).toContain('Datos proporcionados incorrectos');
    expect(m?.textContent).toContain('Nombre del espacio');
    expect(m?.querySelector('button')?.textContent).toContain('Aceptar');
    expect(modal('.sb-modal-panel h2')?.textContent).not.toContain('Confirmas');
    http.expectNone('/api/espacios');
  });

  it('rechaza una capacidad que no sea entera y mayor que 0', async () => {
    llenar();
    escribir('capacidad', '0');
    await enviar();
    expect(modal('sb-dialogo-mensaje')?.textContent).toContain('La capacidad debe ser un número entero mayor que 0');
  });

  it('pide confirmacion Si o No con el resumen, y No conserva los datos', async () => {
    llenar();
    await enviar();
    const panel = document.querySelector('.cdk-overlay-container')!;
    expect(panel.textContent).toContain('¿Confirmas la creación del espacio?');
    expect(panel.textContent).toContain('Sala 5');
    expect(panel.textContent).toContain('8 personas');
    botonModal('No').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(modal('.sb-modal-panel')).toBeNull();
    expect(campo('nombre').value).toBe('Sala 5');
    http.expectNone('/api/espacios');
  });

  it('con Si crea el espacio, muestra el exito con Aceptar y vuelve a Espacios', async () => {
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    llenar();
    await enviar();
    botonModal('Sí').click();
    const req = http.expectOne('/api/espacios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ nombre: 'Sala 5', ubicacion: 'Ingeniería', piso: '3', capacidad: 8 });
    req.flush({ id: 99, ...req.request.body });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.textContent).toContain('El espacio se ha creado exitosamente');
    el.querySelector<HTMLButtonElement>('sb-message button')!.click();
    expect(ir).toHaveBeenCalledWith('/espacios');
  });

  it('si el servidor responde 403 muestra que no tiene permiso', async () => {
    llenar();
    await enviar();
    botonModal('Sí').click();
    http.expectOne('/api/espacios').flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(modal('sb-dialogo-mensaje')?.textContent).toContain('No tienes permiso para ver esta página');
  });
  it('si el servidor dice que el espacio ya existe, muestra el texto exacto con Aceptar y conserva los datos', async () => {
    llenar();
    await enviar();
    botonModal('Sí').click();
    http.expectOne('/api/espacios').flush({ mensaje: 'Ya existe un espacio con ese nombre en esa ubicación', campos: {} }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(modal('sb-dialogo-mensaje')?.textContent).toContain('Ya existe un espacio con ese nombre en esa ubicación');
    botonModal('Aceptar').click();
    fixture.detectChanges();
    expect(modal('sb-dialogo-mensaje')).toBeFalsy();
    expect(campo('nombre').value).toBe('Sala 5');
    expect(campo('ubicacion').value).toBe('Ingeniería');
    expect(campo('piso').value).toBe('3');
    expect(campo('capacidad').value).toBe('8');
  });

  it('si el servidor dice que un campo es obligatorio, lo indica con Aceptar y conserva los datos', async () => {
    llenar();
    await enviar();
    botonModal('Sí').click();
    http.expectOne('/api/espacios').flush({ mensaje: 'Datos proporcionados incorrectos', campos: { piso: 'Este campo es obligatorio.' } }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await fixture.whenStable();
    const texto = modal('sb-dialogo-mensaje')?.textContent ?? '';
    expect(texto).toContain('Datos proporcionados incorrectos');
    expect(texto).toContain('Piso: Este campo es obligatorio.');
    botonModal('Aceptar').click();
    fixture.detectChanges();
    expect(campo('nombre').value).toBe('Sala 5');
  });
});

describe('flujo crear y volver a ver el espacio', () => {
  it('el espacio creado aparece en la lista', async () => {
    const creados: Espacio[] = [];
    const crear = montar(CrearEspacioComponent, 'ADMINISTRADOR');
    crear.fixture.detectChanges();
    await crear.fixture.whenStable();
    const poner = (id: string, v: string) => {
      const c = crear.el.querySelector<HTMLInputElement>('#' + id)!;
      c.value = v;
      c.dispatchEvent(new Event('input'));
    };
    poner('nombre', 'Sala 5');
    poner('ubicacion', 'Ingeniería');
    poner('piso', '3');
    poner('capacidad', '8');
    crear.el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    crear.fixture.detectChanges();
    await crear.fixture.whenStable();
    [...document.querySelectorAll<HTMLButtonElement>('.cdk-overlay-container button')].find((b) => b.textContent?.trim() === 'Sí')!.click();
    const req = crear.http.expectOne('/api/espacios');
    creados.push({ id: 99, ...req.request.body });
    req.flush(creados[0]);
    crear.el.remove();

    const lista = TestBed.createComponent(ConsultarEspaciosComponent);
    document.body.appendChild(lista.nativeElement);
    lista.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/espacios').flush(creados);
    await lista.whenStable();
    expect(lista.nativeElement.textContent).toContain('Sala 5');
    expect(lista.nativeElement.textContent).toContain('Ingeniería');
  });
});
