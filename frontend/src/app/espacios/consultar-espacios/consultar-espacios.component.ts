import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EspacioService } from '../espacio.service';
import { Espacio } from '../espacio.model';
import { SesionService } from '../../core/sesion.service'; 

@Component({
  selector: 'app-consultar-espacios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './consultar-espacios.component.html',
  styleUrls: ['./consultar-espacios.component.css']
})

export class ConsultarEspaciosComponent implements OnInit {
  espacios: Espacio[] = [];
  esAdministrador: boolean = false;

  constructor(
    private espacioService: EspacioService,
    private sesionService: SesionService 
  ) {}

  ngOnInit(): void {
    // Validar el rol actual (Lógica sugerida basada en la estructura del core)
    this.esAdministrador = this.sesionService.esAdmin();

    this.espacioService.consultarEspacios().subscribe({
      next: (datos) => this.espacios = datos,
      error: (err) => console.error('Error cargando espacios', err)
    });
  }
}