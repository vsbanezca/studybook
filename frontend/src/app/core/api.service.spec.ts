import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let http: HttpTestingController;
  let api: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ApiService);
  });

  afterEach(() => http.verify());

  it('antepone la URL base de environments y envia la cookie de sesion en GET', () => {
    let respuesta: unknown;
    api.get<number[]>('/espacios').subscribe((r) => (respuesta = r));
    const req = http.expectOne('/api/espacios');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([1, 2]);
    expect(respuesta).toEqual([1, 2]);
  });

  it('envia los parametros de consulta', () => {
    api.get('/equipamientos', { espacioId: 3 }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/equipamientos');
    expect(req.request.params.get('espacioId')).toBe('3');
    req.flush([]);
  });

  it('envia el cuerpo y la cookie de sesion en POST, con o sin barra inicial en la ruta', () => {
    api.post('auth/login', { correo: 'a@ucab.edu.ve' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ correo: 'a@ucab.edu.ve' });
    req.flush({});
  });
});
