import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { formatearFecha, formatearHora } from '../../compartido/formato-fecha';
import { MSG } from '../../compartido/messages';
import { SbEmptyStateComponent } from '../../compartido/ui/sb-empty-state/sb-empty-state.component';
import { SbMessageComponent } from '../../compartido/ui/sb-message/sb-message.component';
import { EstadoReserva, SbStatusChipComponent } from '../../compartido/ui/sb-status-chip/sb-status-chip.component';
import { Reserva } from '../reserva.model';
import { ReservaService } from '../reserva.service';

@Component({
  selector: 'app-consultar-mis-reservas',
  imports: [SbEmptyStateComponent, SbMessageComponent, SbStatusChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultar-mis-reservas.component.html',
  styleUrl: './consultar-mis-reservas.component.css',
})
export class ConsultarMisReservasComponent implements OnInit {
  private readonly reservaService = inject(ReservaService);
  private readonly router = inject(Router);

  protected readonly reservas = signal<Reserva[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  protected readonly textoError = MSG.comunes.errorCarga;
  protected readonly textoVacioTitulo = MSG.reserva.sinReservasTitulo;
  protected readonly textoVacio = MSG.reserva.sinReservasTexto;

  ngOnInit(): void {
    this.reservaService.listarMisReservas().subscribe({
      next: (datos) => {
        this.reservas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(true);
      },
    });
  }

  protected estado(reserva: Reserva): EstadoReserva {
    return reserva.estado === 'CANCELADA' ? 'Cancelada' : 'Activa';
  }

  protected fecha(reserva: Reserva): string {
    return formatearFecha(reserva.fecha);
  }

  protected horario(reserva: Reserva): string {
    return `De ${formatearHora(reserva.horaInicio)} a ${formatearHora(reserva.horaFin)}`;
  }

  /** Aceptar el aviso de error lo cierra. */
  protected aceptarError(): void {
    this.error.set(false);
  }

  protected irACrearReserva(): void {
    this.router.navigateByUrl('/reservas/nueva');
  }
}
