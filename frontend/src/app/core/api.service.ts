import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Parametros de consulta de una peticion (por ejemplo, { espacioId: 3 } para ?espacioId=3). */
export type ParametrosApi = Record<string, string | number | boolean>;

/**
 * Unico canal de comunicacion del front con el back. Es la unica clase de la aplicacion que usa HttpClient:
 * los servicios de cada historia le pasan la ruta relativa a la API (por ejemplo, '/espacios') y esta clase le
 * antepone la URL base de environments y envia la cookie de sesion (withCredentials).
 * La respuesta 401 la atiende authInterceptor (vuelve a Iniciar sesion).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(ruta: string, parametros?: ParametrosApi): Observable<T> {
    return this.http.get<T>(this.url(ruta), {
      withCredentials: true,
      params: parametros ? new HttpParams({ fromObject: parametros }) : undefined,
    });
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo, { withCredentials: true });
  }

  private url(ruta: string): string {
    return `${this.base}${ruta.startsWith('/') ? ruta : '/' + ruta}`;
  }
}
