import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Espacio } from './espacio.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EspacioService {
  private apiUrl = `${environment.apiUrl}/espacios`;

  constructor(private http: HttpClient) { }

  consultarEspacios(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(this.apiUrl);
  }

  crearEspacio(espacio: Espacio): Observable<Espacio> {
    return this.http.post<Espacio>(this.apiUrl, espacio);
  }
}