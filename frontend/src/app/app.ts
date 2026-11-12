import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CuentaService } from './cuenta/cuenta.service';
import { SbHeaderComponent } from './compartido/ui/sb-header/sb-header.component';
import { SesionService } from './core/sesion.service';

@Component({
  imports: [RouterOutlet, SbHeaderComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly sesion = inject(SesionService);
  private readonly cuentas = inject(CuentaService);
  private readonly router = inject(Router);

  /**
   * Cerrar sesion: se invalida la sesion en el servidor y, pase lo que pase con esa llamada
   * (incluso si el servidor ya no la reconocia), se limpia el estado local y se va a Iniciar sesion.
   */
  protected cerrarSesion(): void {
    const terminar = () => {
      this.sesion.limpiar();
      this.router.navigateByUrl('/iniciar-sesion');
    };
    this.cuentas.cerrarSesion().subscribe({ next: terminar, error: terminar });
  }
}
