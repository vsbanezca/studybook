import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { SbEmptyStateComponent } from '../../compartido/ui/sb-empty-state/sb-empty-state.component';
import { SbSpaceCardComponent } from '../../compartido/ui/sb-space-card/sb-space-card.component';
import { SesionService } from '../../core/sesion.service';
import { Espacio } from '../espacio.model';
import { EspacioService } from '../espacio.service';

@Component({
  selector: 'app-consultar-espacios',
  imports: [RouterLink, SbEmptyStateComponent, SbSpaceCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultar-espacios.component.html',
  styleUrls: ['./consultar-espacios.component.css']
})

export class ConsultarEspaciosComponent implements OnInit {
  espacios = signal<Espacio[]>([]);
  cargado = signal(false);
  esAdministrador = false;

  constructor(
    private espacioService: EspacioService,
    private sesionService: SesionService,
    private dialog: Dialog
  ) {}

  ngOnInit(): void {
    this.esAdministrador = this.sesionService.esAdmin();

    this.espacioService.consultarEspacios().subscribe({
      next: (datos) => {
        this.espacios.set(datos);
        this.cargado.set(true);
      },
      error: () => {
        this.cargado.set(true);
        this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo: MSG.comunes.errorServidor }));
      }
    });
  }
}
