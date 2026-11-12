import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { sinSesionGuard } from '../../core/auth.guard';
import { SesionService } from '../../core/sesion.service';
import { CuentaService } from '../cuenta.service';
import { RegistrarseComponent } from './registrarse.component';

describe('RegistrarseComponent', () => {
  let fixture: ComponentFixture<RegistrarseComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const campo = (id: string) => el.querySelector<HTMLInputElement>('#' + id)!;
  const escribir = (id: string, valor: string) => {
    const c = campo(id);
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  const llenar = (cambios: Record<string, string> = {}) => {
    const valores = {
      nombre: 'Ana Pérez',
      cedula: '12345678',
      correo: 'ana@ucab.edu.ve',
      telefono: '+584141234567',
      clave: 'Clave-segura-1',
      ...cambios,
    };
    Object.entries(valores).forEach(([id, valor]) => escribir(id, valor));
  };
  const enviar = async () => {
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const mensaje = () => document.querySelector('sb-dialogo-mensaje');
  const panelConfirmar = () => document.querySelector('.sb-modal-panel:not(.sb-modal-mensaje)');
  const botonesConfirmar = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.sb-modal-panel button'));
  const aceptar = async () => {
    mensaje()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RegistrarseComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(RegistrarseComponent);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    await fixture.whenStable();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
    el.remove();
  });

  it('muestra los cinco campos, la contrasena oculta, el boton Registrarse y el enlace Iniciar sesión', () => {
    ['nombre', 'cedula', 'correo', 'telefono', 'clave'].forEach((id) => expect(campo(id)).toBeTruthy());
    expect(campo('clave').type).toBe('password');
    expect(el.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Registrarse');
    const enlace = el.querySelector('a')!;
    expect(enlace.textContent?.trim()).toBe('Iniciar sesión');
    expect(enlace.getAttribute('href')).toBe('/iniciar-sesion');
    expect(el.textContent).not.toContain('Cancelar');
  });

  it('con campos vacios muestra los errores con Aceptar y no llama al servidor', async () => {
    await enviar();
    const texto = mensaje()?.textContent ?? '';
    expect(texto).toContain('Datos proporcionados incorrectos');
    expect(texto).toContain('El nombre es obligatorio');
    expect(texto).toContain('La cédula es obligatoria');
    expect(texto).toContain('El correo es obligatorio');
    expect(texto).toContain('El teléfono es obligatorio');
    expect(texto).toContain('La contraseña es obligatoria');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
    expect(panelConfirmar()).toBeNull();
    http.expectNone('/api/auth/registro');
  });

  it('al aceptar el error enfoca el primer campo con error y marca los campos', async () => {
    await enviar();
    await aceptar();
    expect(mensaje()).toBeNull();
    expect(document.activeElement).toBe(campo('nombre'));
    expect(campo('nombre').getAttribute('aria-invalid')).toBe('true');
  });

  it('valida cedula numerica, correo, telefono y largo de contrasena', async () => {
    llenar({ cedula: 'V-123', correo: 'no-es-correo', telefono: '0414-123', clave: 'corta' });
    await enviar();
    const texto = mensaje()?.textContent ?? '';
    expect(texto).toContain('La cédula debe tener solo números');
    expect(texto).toContain('El correo debe tener formato de correo electrónico');
    expect(texto).toContain('El teléfono debe tener de 10 a 15 dígitos');
    expect(texto).toContain('La contraseña debe tener al menos 8 caracteres');
    http.expectNone('/api/auth/registro');
  });

  it('con datos validos pide confirmar con un resumen que no incluye la contrasena', async () => {
    llenar();
    await enviar();
    const texto = panelConfirmar()?.textContent ?? '';
    expect(texto).toContain('¿Confirmas el registro?');
    expect(texto).toContain('Ana Pérez');
    expect(texto).toContain('12345678');
    expect(texto).toContain('ana@ucab.edu.ve');
    expect(texto).toContain('+584141234567');
    expect(texto).not.toContain('Clave-segura-1');
    expect(botonesConfirmar().map((b) => b.textContent?.trim())).toEqual(['No', 'Sí']);
    http.expectNone('/api/auth/registro');
  });

  it('No vuelve al formulario con los datos conservados y no envia nada', async () => {
    llenar();
    await enviar();
    botonesConfirmar()[0].click();
    await fixture.whenStable();
    expect(panelConfirmar()).toBeNull();
    expect(campo('nombre').value).toBe('Ana Pérez');
    expect(campo('correo').value).toBe('ana@ucab.edu.ve');
    expect(campo('clave').value).toBe('Clave-segura-1');
    http.expectNone('/api/auth/registro');
  });

  it('Sí envia los cinco datos, muestra el exito con Aceptar y Aceptar va a Iniciar sesión', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    llenar();
    await enviar();
    botonesConfirmar()[1].click();
    const req = http.expectOne('/api/auth/registro');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre: 'Ana Pérez', cedula: '12345678', correo: 'ana@ucab.edu.ve', telefono: '+584141234567', clave: 'Clave-segura-1',
    });
    req.flush({ nombre: 'Ana Pérez', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' }, { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    const exito = el.querySelector('sb-message')!;
    expect(exito.textContent).toContain('La cuenta se ha creado exitosamente');
    expect(navegar).not.toHaveBeenCalled();
    exito.querySelector<HTMLButtonElement>('button')!.click();
    expect(navegar).toHaveBeenCalledWith('/iniciar-sesion');
    // Registrarse no inicia sesion.
    expect(TestBed.inject(SesionService).autenticado()).toBe(false);
  });

  it('un correo repetido se muestra con el texto del servidor y Aceptar, y conserva los datos', async () => {
    llenar();
    await enviar();
    botonesConfirmar()[1].click();
    http.expectOne('/api/auth/registro').flush(
      { mensaje: 'Ya existe una cuenta con ese correo', campos: {} },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('Ya existe una cuenta con ese correo');
    await aceptar();
    expect(mensaje()).toBeNull();
    expect(campo('correo').value).toBe('ana@ucab.edu.ve');
    expect(el.querySelector('sb-message')).toBeNull();
  });

  it('un error de campo del servidor lo muestra con la etiqueta del campo', async () => {
    llenar();
    await enviar();
    botonesConfirmar()[1].click();
    http.expectOne('/api/auth/registro').flush(
      { mensaje: 'Datos proporcionados incorrectos', campos: { correo: 'Usa tu correo institucional' } },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('Datos proporcionados incorrectos');
    expect(mensaje()?.textContent).toContain('Correo institucional: Usa tu correo institucional');
  });

  it('si el servidor no responde muestra el error de conexion con Aceptar', async () => {
    llenar();
    await enviar();
    botonesConfirmar()[1].click();
    http.expectOne('/api/auth/registro').flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(mensaje()?.textContent).toContain('No se pudo conectar con el servidor');
    expect(mensaje()?.querySelector('button')?.textContent).toContain('Aceptar');
  });
});

describe('CuentaService.registrar', () => {
  it('envia POST /api/auth/registro', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(CuentaService)
      .registrar({ nombre: 'A', cedula: '1', correo: 'a@ucab.edu.ve', telefono: '04141234567', clave: '12345678' })
      .subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('/api/auth/registro');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});

describe('ruta /registrarse', () => {
  it('un usuario con sesion no entra a la pantalla: lo manda a Espacios', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' });
    const resultado = TestBed.runInInjectionContext(() => sinSesionGuard({} as never, {} as never));
    expect(String(resultado)).toBe('/espacios');
  });

  it('sin sesion si entra', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    expect(TestBed.runInInjectionContext(() => sinSesionGuard({} as never, {} as never))).toBe(true);
  });
});
