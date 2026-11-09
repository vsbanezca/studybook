import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { EspacioService } from '../espacio.service';
import { Espacio } from '../espacio.model';
import { mensajes } from '../../compartido/messages'; 

@Component({
  selector: 'app-crear-espacio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './crear-espacio.component.html',
  styleUrls: ['./crear-espacio.component.css']
})

export class CrearEspacioComponent {
  nuevoEspacio: Espacio = {
    nombre: '',
    ubicacion: '',
    piso: '',
    descripcion: '',
    capacidad: 1
  };
  
  mostrarModalConfirmacion: boolean = false;
  mostrarMensajeExito: boolean = false;
  textoExito: string = mensajes.espacioCreado; // Definido en messages.ts

  constructor(private espacioService: EspacioService, private router: Router) {}

  solicitarConfirmacion(): void {
    this.mostrarModalConfirmacion = true;
  }

  cancelarConfirmacion(): void {
    // Si la respuesta es "No", se cierra el modal conservando los datos
    this.mostrarModalConfirmacion = false;
  }

  confirmarCreacion(): void {
    this.mostrarModalConfirmacion = false;
    this.espacioService.crearEspacio(this.nuevoEspacio).subscribe({
      next: () => {
        this.mostrarMensajeExito = true;
      },
      error: (err) => console.error('Error', err)
    });
  }

  aceptarMensajeExito(): void {
    // Al presionar "Aceptar", se vuelve a la pantalla de consulta de espacios
    this.router.navigate(['/espacios']);
  }
}