import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogoConfirmacionComponent } from '../../compartido/dialogo-confirmacion/dialogo-confirmacion.component';
import { MSG } from '../../compartido/messages';
import { CuentaService } from '../cuenta.service';

@Component({
  selector: 'app-registrarse',
  templateUrl: './registrarse.component.html',
  styleUrls: ['./registrarse.component.css']
})
export class RegistrarseComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  msg = MSG;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private cuentaService: CuentaService
  ) {
    this.registerForm = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      cedula: ['', [Validators.required, Validators.pattern(/^V-\d{7,8}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^04\d{2}-\d{7}$/)]],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('contrasena')?.value;
    const confirm = g.get('confirmarContrasena')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  isInstitutionalEmail(email: string): boolean {
    return email.endsWith('@ucab.edu.ve') || email.endsWith('@est.ucab.edu.ve');
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.errorMessage = this.msg.comunes.datosInvalidos;
      return;
    }

    const email = this.registerForm.get('correo')?.value;
    if (!this.isInstitutionalEmail(email)) {
      this.errorMessage = this.msg.cuenta.correoNoUcab;
      return;
    }

    if (this.registerForm.errors?.['mismatch']) {
      this.errorMessage = this.msg.cuenta.clavesDistintas;
      return;
    }

    // Modal de confirmación Sí/No (Requisito estricto de la guía de estilo)[cite: 10, 13]
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      data: {
        titulo: this.msg.cuenta.confirmar,
        datos: [
          { etiqueta: 'Nombre', valor: this.registerForm.value.nombreCompleto },
          { etiqueta: 'Correo', valor: email },
          { etiqueta: 'Cédula', valor: this.registerForm.value.cedula },
          { etiqueta: 'Teléfono', valor: this.registerForm.value.telefono }
        ]
      },
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.ejecutarRegistro();
      }
      // Si responde "No", el modal se cierra y los datos se conservan en el formulario[cite: 10, 13].
    });
  }

  ejecutarRegistro() {
    this.isLoading = true;
    
    // Llamada al servicio cumpliendo con el RNF de tiempo de respuesta (< 3 segundos)
    this.cuentaService.registrar(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirige al inicio de sesión pasando el mensaje de éxito (que termina en "Aceptar")[cite: 2, 10, 13]
        this.router.navigate(['/iniciar-sesion'], { 
          state: { message: this.msg.cuenta.creada } 
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || this.msg.cuenta.correoRegistrado;
      }
    });
  }

  onCancel() {
    // Cancelar descarta los datos y redirige al inicio de sesión[cite: 10, 13]
    this.router.navigate(['/iniciar-sesion']);
  }
}
