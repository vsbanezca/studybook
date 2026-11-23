import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { CredencialesLogin, DatosRegistro, Sesion } from './cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly api = inject(ApiService);

  iniciarSesion(credenciales: CredencialesLogin): Observable<Sesion> {
    return this.api.post<Sesion>('/auth/login', credenciales);
  }

  /** Crea una cuenta de Miembro. No inicia sesion: devuelve los datos publicos de la cuenta nueva. */
  registrar(datos: DatosRegistro): Observable<Sesion> {
    return this.api.post<Sesion>('/auth/registro', datos);
  }

  /** Cierra la sesion en el servidor (la invalida). Responde 204 sin cuerpo. */
  cerrarSesion(): Observable<void> {
    return this.api.post<void>('/auth/logout', {});
  }

  /** Consulta si el navegador ya tiene una sesion abierta en el servidor. */
  sesionActual(): Observable<Sesion> {
    return this.api.get<Sesion>('/auth/sesion');
  }
}
