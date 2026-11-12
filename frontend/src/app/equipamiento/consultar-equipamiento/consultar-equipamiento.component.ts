import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DialogoMensajeComponent, opcionesDialogoMensaje } from '../../compartido/dialogo-mensaje/dialogo-mensaje.component';
import { MSG } from '../../compartido/messages';
import { SbEmptyStateComponent } from '../../compartido/ui/sb-empty-state/sb-empty-state.component';
import { SesionService } from '../../core/sesion.service';
import { Espacio } from '../../espacios/espacio.model';
import { EspacioService } from '../../espacios/espacio.service';
import { Equipamiento } from '../equipamiento.model';
import { EquipamientoService } from '../equipamiento.service';

@Component({
  selector: 'app-consultar-equipamiento',
  imports: [RouterLink, SbEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultar-equipamiento.component.html',
  styleUrl: './consultar-equipamiento.component.css',
})
export class ConsultarEquipamientoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly espacios = inject(EspacioService);
  private readonly equipamientos = inject(EquipamientoService);
  private readonly sesion = inject(SesionService);

  protected readonly espacio = signal<Espacio | null>(null);
  protected readonly lista = signal<Equipamiento[]>([]);
  protected readonly cargado = signal(false);

  protected readonly esAdministrador = this.sesion.esAdmin();
  protected readonly textoVacio = MSG.equipamiento.vacio;
  protected readonly textoVacioApoyo = this.esAdministrador ? MSG.equipamiento.vacioAdmin : MSG.equipamiento.vacioMiembro;
  protected readonly rutaAgregar = computed(() => ['/espacios', this.espacio()?.id, 'equipamiento', 'nuevo']);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.espacios.consultarEspacios().subscribe({
      next: (todos) => {
        const encontrado = todos.find((e) => e.id === id);
        if (!encontrado) {
          this.avisarYVolver(MSG.equipamiento.espacioNoExiste);
          return;
        }
        this.espacio.set(encontrado);
        this.cargarEquipamiento(id);
      },
      error: () => this.avisarYVolver(MSG.comunes.errorServidor),
    });
  }

  private cargarEquipamiento(id: number): void {
    this.equipamientos.consultarPorEspacio(id).subscribe({
      next: (datos) => {
        this.lista.set(datos);
        this.cargado.set(true);
      },
      error: (error: unknown) => {
        const noExiste = error instanceof HttpErrorResponse && error.status === 404;
        this.avisarYVolver(noExiste ? MSG.equipamiento.espacioNoExiste : MSG.comunes.errorServidor);
      },
    });
  }

  /** Muestra el error con Aceptar y, al aceptar, vuelve a Espacios. */
  private avisarYVolver(titulo: string): void {
    this.cargado.set(true);
    const ref = this.dialog.open(DialogoMensajeComponent, opcionesDialogoMensaje({ titulo }));
    ref.closed.subscribe(() => this.router.navigateByUrl('/espacios'));
  }
}
