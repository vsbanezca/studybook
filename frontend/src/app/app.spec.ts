import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { SesionService } from './core/sesion.service';

describe('App: cerrar sesion', () => {
  let http: HttpTestingController;
  let el: HTMLElement;
  let navegar: ReturnType<typeof vi.spyOn>;

  const abrirMenuYCerrar = async (fixture: { whenStable: () => Promise<unknown> }) => {
    el.querySelector<HTMLButtonElement>('button.avatar')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('[role="menuitem"]')!.click();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(SesionService).establecer({ nombre: 'Ana Pérez', correo: 'ana@ucab.edu.ve', rol: 'MIEMBRO' });
    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    await fixture.whenStable();
    (el as unknown as { fixture: unknown }).fixture = fixture;
  });

  afterEach(() => el.remove());

  const fixture = () => (el as unknown as { fixture: { whenStable: () => Promise<unknown> } }).fixture;

  it('el perfil abre un menu y «Cerrar sesión» llama a POST /api/auth/logout', async () => {
    await abrirMenuYCerrar(fixture());
    const req = http.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('al responder 204 limpia la sesion, desaparece el encabezado y va a Iniciar sesión', async () => {
    const sesion = TestBed.inject(SesionService);
    await abrirMenuYCerrar(fixture());
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await fixture().whenStable();
    expect(sesion.autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith('/iniciar-sesion');
    expect(el.querySelector('sb-header')).toBeNull();
  });

  it('aunque el servidor falle o ya no reconozca la sesion, igual sale a Iniciar sesión', async () => {
    const sesion = TestBed.inject(SesionService);
    await abrirMenuYCerrar(fixture());
    http.expectOne('/api/auth/logout').flush({ mensaje: 'Debes iniciar sesión', campos: {} }, { status: 401, statusText: 'Unauthorized' });
    await fixture().whenStable();
    expect(sesion.autenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith('/iniciar-sesion');
  });
});
