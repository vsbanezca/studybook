import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Espacio } from './espacio.model';

@Injectable({
  providedIn: 'root'
})
export class EspacioService {
  private readonly api = inject(ApiService);

  consultarEspacios(): Observable<Espacio[]> {
    return this.api.get<Espacio[]>('/espacios');
  }

  crearEspacio(espacio: Espacio): Observable<Espacio> {
    return this.api.post<Espacio>('/espacios', espacio);
  }
}
