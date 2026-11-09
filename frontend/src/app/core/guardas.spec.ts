import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree, provideRouter } from '@angular/router';
import { SbHeaderComponent } from '../compartido/ui/sb-header/sb-header.component';
import { adminGuard, miembroGuard } from './admin.guard';
import { authGuard, sinSesionGuard } from './auth.guard';
import { SesionService } from './sesion.service';

describe('guardas de ruta y rol', () => {
  let sesion: SesionService;
  const ejecutar = (g: CanActivateFn) => TestBed.runInInjectionContext(() => g({} as never, {} as never));
  const destino = (r: unknown) => (r instanceof UrlTree ? TestBed.inject(Router).serializeUrl(r) : r);

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    sesion = TestBed.inject(SesionService);
  });

  it('una ruta protegida sin sesion lleva al login', () => {
    expect(destino(ejecutar(authGuard))).toBe('/iniciar-sesion');
  });

  it('una ruta protegida con sesion deja pasar', () => {
    sesion.establecer({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    expect(ejecutar(authGuard)).toBe(true);
  });

  it('el login con sesion redirige a la pantalla principal', () => {
    sesion.establecer({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    expect(destino(ejecutar(sinSesionGuard))).toBe('/espacios');
  });

  it('el login sin sesion se muestra', () => {
    expect(ejecutar(sinSesionGuard)).toBe(true);
  });

  it('la administracion rechaza a un Miembro', () => {
    sesion.establecer({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    expect(destino(ejecutar(adminGuard))).toBe('/espacios');
  });

  it('la administracion deja pasar al Administrador y pide login sin sesion', () => {
    expect(destino(ejecutar(adminGuard))).toBe('/iniciar-sesion');
    sesion.establecer({ nombre: 'Admin', correo: 'ad@ucab.edu.ve', rol: 'ADMINISTRADOR' });
    expect(ejecutar(adminGuard)).toBe(true);
  });
});

describe('guarda de Mis reservas', () => {
  const ejecutar = () => TestBed.runInInjectionContext(() => miembroGuard({} as never, {} as never));
  const destino = (r: unknown) => (r instanceof UrlTree ? TestBed.inject(Router).serializeUrl(r) : r);

  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }),
  );

  it('deja pasar al Miembro', () => {
    TestBed.inject(SesionService).establecer({ nombre: 'Ana', correo: 'a@ucab.edu.ve', rol: 'MIEMBRO' });
    expect(ejecutar()).toBe(true);
  });

  it('el Administrador vuelve a Espacios', () => {
    TestBed.inject(SesionService).establecer({ nombre: 'Ad', correo: 'ad@ucab.edu.ve', rol: 'ADMINISTRADOR' });
    expect(destino(ejecutar())).toBe('/espacios');
  });

  it('sin sesion va al login', () => {
    expect(destino(ejecutar())).toBe('/iniciar-sesion');
  });
});

describe('navegacion segun rol', () => {
  const rutas = [{ path: 'espacios', children: [] }, { path: 'mis-reservas', children: [] }];
  const etiquetas = (rol: 'miembro' | 'admin') => {
    TestBed.configureTestingModule({ imports: [SbHeaderComponent], providers: [provideRouter(rutas)] });
    const f = TestBed.createComponent(SbHeaderComponent);
    f.componentRef.setInput('rol', rol);
    f.detectChanges();
    return [...f.nativeElement.querySelectorAll('nav a')].map((a) => (a as HTMLElement).textContent!.trim());
  };

  it('Miembro ve Espacios y Mis reservas', () => {
    expect(etiquetas('miembro')).toEqual(['Espacios', 'Mis reservas']);
  });

  it('Administrador ve solo Espacios', () => {
    expect(etiquetas('admin')).toEqual(['Espacios']);
  });
});
