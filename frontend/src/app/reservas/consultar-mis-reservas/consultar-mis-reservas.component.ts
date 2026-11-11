import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../reserva.service';
import { MSG } from '../../compartido/messages';

@Component({
  selector: 'app-consultar-mis-reservas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultar-mis-reservas.component.html',
  styleUrls: ['./consultar-mis-reservas.component.css']
})
export class ConsultarMisReservasComponent implements OnInit {
  reservas: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  msg = MSG;

  constructor(
    private reservaService: ReservaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMisReservas();
  }

  cargarMisReservas(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Cumpliendo con el RNF de tiempo de respuesta (< 2 segundos)
    this.reservaService.obtenerMisReservas().subscribe({
      next: (data) => {
        this.reservas = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = this.msg.comunes.errorCarga;
      }
    });
  }

  irACrearReserva(): void {
    this.router.navigate(['/reservas/nueva']);
  }
}
