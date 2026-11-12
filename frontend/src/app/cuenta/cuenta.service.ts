import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CredencialesLogin, DatosRegistro, Sesion } from './cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);

  iniciarSesion(credenciales: CredencialesLogin): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/login', credenciales);
  }

  /** Crea una cuenta de Miembro. No inicia sesion: devuelve los datos publicos de la cuenta nueva. */
  registrar(datos: DatosRegistro): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/registro', datos);
  }

  /** Cierra la sesion en el servidor (la invalida). Responde 204 sin cuerpo. */
  cerrarSesion(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  /** Consulta si el navegador ya tiene una sesion abierta en el servidor. */
  sesionActual(): Observable<Sesion> {
    return this.http.get<Sesion>('/api/auth/sesion');
  }
}
