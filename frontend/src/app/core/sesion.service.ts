import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SesionService {
  constructor() { }

  obtenerRol(): string {
    // Simulamos que eres Administrador para que puedas ver el botón de "Crear espacio"
    return 'ADMINISTRADOR'; 
  }
}