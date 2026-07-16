import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { SharedModule } from '../../shared/module/shared/shared.module';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotForm!: FormGroup;
  emailControl!: FormControl;
  loading = false;
  successMessage = false;

  constructor(
    private _authService: AuthService,
    private _notificationsService: NotifecationsService,
    private _router: Router
  ) {
    this.emailControl = new FormControl('', [Validators.required, Validators.email]);
    this.forgotForm = new FormGroup({
      email: this.emailControl,
    });
  }

  submit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.emailControl.value;
    this.loading = true;

    this._authService.requestResetCode(email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = true;
        this._notificationsService.showSuccess(
          'Success',
          'If this email is registered with us, a reset code has been sent to it.'
        );
        this._authService.setResetEmail(email);
      },
      error: (err) => {
        this.loading = false;
        this._notificationsService.showError(
          'Error',
          err.error?.message || 'An error occurred. Please try again.'
        );
      },
    });
  }
}
