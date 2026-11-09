import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { SesionService } from './sesion.service';

describe('SesionService y authInterceptor', () => {
  let http: HttpTestingController;
  let sesion: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    sesion = TestBed.inject(SesionService);
  });

  it('restaura la sesion del servidor al recargar', async () => {
    const promesa = sesion.restaurar();
    http.expectOne('/api/auth/sesion').flush({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    await promesa;
    expect(sesion.rolHeader()).toBe('miembro');
  });

  it('sin sesion en el servidor queda sin usuario', async () => {
    const promesa = sesion.restaurar();
    http.expectOne('/api/auth/sesion').flush({}, { status: 401, statusText: 'Unauthorized' });
    await promesa;
    expect(sesion.autenticado()).toBe(false);
  });

  it('envia la cookie y, ante un 401, limpia la sesion y vuelve al login', () => {
    sesion.establecer({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    const ir = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.inject(HttpClient).get('/api/espacios').subscribe({ error: () => undefined });
    const req = http.expectOne('/api/espacios');
    expect(req.request.withCredentials).toBe(true);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(sesion.autenticado()).toBe(false);
    expect(ir).toHaveBeenCalledWith('/iniciar-sesion');
  });
});
