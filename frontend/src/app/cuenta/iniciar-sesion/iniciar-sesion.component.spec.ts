import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SesionService } from '../../core/sesion.service';
import { IniciarSesionComponent } from './iniciar-sesion.component';

describe('IniciarSesionComponent', () => {
  let fixture: ComponentFixture<IniciarSesionComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const campo = (id: string) => el.querySelector<HTMLInputElement>('#' + id)!;
  const escribir = (id: string, valor: string) => {
    const c = campo(id);
    c.value = valor;
    c.dispatchEvent(new Event('input'));
  };
  const enviar = () => el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  const modal = () => document.querySelector('sb-dialogo-mensaje');
  const aceptar = async () => {
    modal()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [IniciarSesionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(IniciarSesionComponent);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    await fixture.whenStable();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
    el.remove();
  });

  it('muestra los campos de correo y contrasena, ocultando la contrasena', () => {
    expect(el.querySelector('label[for="correo"]')?.textContent).toContain('Correo');
    expect(el.querySelector('label[for="clave"]')?.textContent).toContain('Contraseña');
    expect(campo('clave').type).toBe('password');
    expect(el.querySelector('h1')?.textContent).toContain('Iniciar sesión');
  });

  it('no ofrece recuperar la contrasena y enlaza a Registrarse', () => {
    expect(el.textContent).not.toMatch(/olvid|recuper/i);
    const enlaces = el.querySelectorAll('a');
    expect(enlaces.length).toBe(1);
    expect(enlaces[0].textContent?.trim()).toBe('Registrarse');
    expect(enlaces[0].getAttribute('href')).toBe('/registrarse');
  });

  it('tiene un solo boton, Iniciar sesión, sin Cancelar', () => {
    const botones = el.querySelectorAll('button');
    expect(botones.length).toBe(1);
    expect(botones[0].textContent?.trim()).toBe('Iniciar sesión');
    expect(botones[0].type).toBe('submit');
    expect(el.textContent).not.toContain('Cancelar');
  });

  it('con datos invalidos muestra el error con Aceptar y no llama al servidor', async () => {
    enviar();
    await fixture.whenStable();
    expect(modal()?.textContent).toContain('Datos proporcionados incorrectos');
    expect(modal()?.textContent).toContain('El correo es obligatorio');
    expect(modal()?.textContent).toContain('La contraseña es obligatoria');
    expect(modal()?.querySelector('button')?.textContent).toContain('Aceptar');
    http.expectNone('/api/auth/login');
  });

  it('rechaza un correo con formato invalido indicando el campo', async () => {
    escribir('correo', 'no-es-correo');
    escribir('clave', 'x');
    enviar();
    await fixture.whenStable();
    expect(modal()?.textContent).toContain('El correo debe tener formato de correo electrónico');
    expect(modal()?.textContent).not.toContain('La contraseña es obligatoria');
  });

  it('al aceptar el error de datos vuelve al formulario', async () => {
    enviar();
    await fixture.whenStable();
    await aceptar();
    expect(modal()).toBeNull();
    expect(document.activeElement).toBe(campo('correo'));
  });

  it('con credenciales incorrectas muestra el texto exacto y, al aceptar, conserva el correo y limpia la contrasena', async () => {
    escribir('correo', 'ana@ucab.edu.ve');
    escribir('clave', 'mala');
    enviar();
    http.expectOne('/api/auth/login').flush({ mensaje: 'x' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(modal()?.textContent).toContain('Correo o contraseña incorrectos');
    await aceptar();
    expect(modal()).toBeNull();
    expect(campo('correo').value).toBe('ana@ucab.edu.ve');
    expect(campo('clave').value).toBe('');
  });

  it('Enter dentro de un campo envia el formulario', () => {
    escribir('correo', 'ana@ucab.edu.ve');
    escribir('clave', 'secreta');
    // El formulario se envia con Enter porque el unico boton es de tipo submit.
    const submit = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.form).toBe(el.querySelector('form'));
    enviar();
    http.expectOne('/api/auth/login');
  });

  it('con credenciales correctas inicia la sesion y va a Consultar espacios', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    escribir('correo', 'admin@ucab.edu.ve');
    escribir('clave', 'ok');
    enviar();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ correo: 'admin@ucab.edu.ve', clave: 'ok' });
    req.flush({ nombre: 'Admin', correo: 'admin@ucab.edu.ve', rol: 'ADMINISTRADOR' });
    expect(TestBed.inject(SesionService).rolHeader()).toBe('admin');
    expect(navegar).toHaveBeenCalledWith('/espacios');
    expect(modal()).toBeNull();
  });
});
