// TODO: eliminar antes de entregar (galeria de componentes, solo desarrollo)
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { formatearFecha, formatearHora } from '../compartido/formato-fecha';
import { MSG } from '../compartido/messages';
import { SbConfirmDialogComponent } from '../compartido/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { SbEmptyStateComponent } from '../compartido/ui/sb-empty-state/sb-empty-state.component';
import { SbHeaderComponent } from '../compartido/ui/sb-header/sb-header.component';
import { ICONOS, NombreIcono } from '../compartido/ui/sb-icon/iconos';
import { SbIconComponent } from '../compartido/ui/sb-icon/sb-icon.component';
import { SbMessageComponent } from '../compartido/ui/sb-message/sb-message.component';
import { SbSpaceCardComponent } from '../compartido/ui/sb-space-card/sb-space-card.component';
import { SbStatusChipComponent } from '../compartido/ui/sb-status-chip/sb-status-chip.component';
import { SbWordmarkComponent } from '../compartido/ui/sb-wordmark/sb-wordmark.component';
import { Espacio } from '../espacios/espacio.model';

@Component({
  selector: 'sb-galeria',
  imports: [
    SbConfirmDialogComponent, SbIconComponent, SbEmptyStateComponent, SbHeaderComponent,
    SbMessageComponent, SbSpaceCardComponent, SbStatusChipComponent, SbWordmarkComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css',
})
export class GaleriaComponent {
  protected readonly MSG = MSG;
  protected readonly iconos = Object.keys(ICONOS) as NombreIcono[];
  protected readonly escalaVerde = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  protected readonly colores = [
    ['--sb-accent', 'Ámbar'], ['--sb-bg', 'Fondo'], ['--sb-surface', 'Superficie'], ['--sb-text', 'Texto'],
    ['--sb-text-muted', 'Apoyo'], ['--sb-field-border', 'Borde de campo'], ['--sb-border', 'Borde decorativo'],
    ['--sb-error', 'Error'], ['--sb-success-bg', 'Éxito tinte'], ['--sb-error-bg', 'Error tinte'],
    ['--sb-warn-bg', 'Aviso tinte'], ['--sb-info-bg', 'Info tinte'],
  ];
  protected readonly espacios: Espacio[] = [
    { id: '1', nombre: 'Sala de estudio 3', ubicacion: 'Biblioteca', piso: '2', capacidad: 6 },
    { id: '2', nombre: 'Cubículo 12', ubicacion: 'Biblioteca', piso: '1', capacidad: 2 },
    { id: '3', nombre: 'Sala de proyectos A', ubicacion: 'Ingeniería', piso: '3', capacidad: 8 },
  ];
  protected readonly seleccionado = signal<number | string | undefined>(2);
  protected readonly modalAbierto = signal(false);
  protected readonly ultimaRespuesta = signal('Sin respuesta');
  protected readonly mensajeVisible = signal(true);

  protected readonly datosModal = [
    { etiqueta: 'Espacio', valor: 'Sala de estudio 3' },
    { etiqueta: 'Fecha', valor: formatearFecha('2026-11-09') },
    { etiqueta: 'Horario', valor: formatearHora('16:00') + ' a ' + formatearHora('18:00') },
    { etiqueta: 'Asistentes', valor: '4' },
  ];
}
