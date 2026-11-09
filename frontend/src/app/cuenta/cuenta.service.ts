import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CredencialesLogin, Sesion } from './cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);

  iniciarSesion(credenciales: CredencialesLogin): Observable<Sesion> {
    return this.http.post<Sesion>('/api/auth/login', credenciales);
  }

  /** Consulta si el navegador ya tiene una sesion abierta en el servidor. */
  sesionActual(): Observable<Sesion> {
    return this.http.get<Sesion>('/api/auth/sesion');
  }
}
