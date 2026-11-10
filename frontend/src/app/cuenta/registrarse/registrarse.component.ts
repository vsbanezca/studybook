import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SbConfirmDialogComponent } from '../../../shared/ui/sb-confirm-dialog/sb-confirm-dialog.component';
import { MSG } from '../../../shared/messages';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;
  msg = MSG; // Exponemos el objeto al template

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router
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

    // Modal de confirmación Sí/No usando las propiedades de tu MSG
    const dialogRef = this.dialog.open(SbConfirmDialogComponent, {
      data: {
        title: this.msg.cuenta.confirmar,
        dataSummary: [
          { label: 'Nombre', value: this.registerForm.value.nombreCompleto },
          { label: 'Correo', value: email },
          { label: 'Cédula', value: this.registerForm.value.cedula },
          { label: 'Teléfono', value: this.registerForm.value.telefono }
        ]
      },
      width: '420px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.ejecutarRegistro();
      }
      // Si responde "No", se conservan los datos en el formulario.
    });
  }

  ejecutarRegistro() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      // Redirige al login pasando el mensaje de éxito definido en tu objeto MSG
      this.router.navigate(['/iniciar-sesion'], { 
        state: { message: this.msg.cuenta.creada } 
      });
    }, 1000);
  }

  onCancel() {
    this.router.navigate(['/iniciar-sesion']);
  }
}
