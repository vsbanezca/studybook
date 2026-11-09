import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
}
