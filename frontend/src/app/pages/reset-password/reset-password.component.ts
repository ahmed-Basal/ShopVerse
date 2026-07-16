import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { SharedModule } from '../../shared/module/shared/shared.module';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  passwordControl!: FormControl;
  confirmPasswordControl!: FormControl;
  email = '';
  code = '';
  loading = false;
  sessionExpired = false;

  constructor(
    private _authService: AuthService,
    private _notificationsService: NotifecationsService,
    private _router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.email = this._authService.getResetEmail();
    this.code = this._authService.getVerifiedCode();

    if (!this.email || !this.code) {
      this.sessionExpired = true;
      this._notificationsService.showWarn('Warning', 'Session expired. Please start forgot password flow again.');
    }
  }

  initForm(): void {
    this.passwordControl = new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(20),
    ]);
    this.confirmPasswordControl = new FormControl('', [
      Validators.required,
      this.passwordMatch(this.passwordControl),
    ]);

    this.resetForm = new FormGroup({
      newPassword: this.passwordControl,
      confirmPassword: this.confirmPasswordControl,
    });
  }

  passwordMatch(pass: AbstractControl): ValidatorFn {
    return (confirmPass: AbstractControl): null | { [key: string]: boolean } => {
      if (pass.value !== confirmPass.value || confirmPass.value === '') {
        return { passNotMatch: true };
      }
      return null;
    };
  }

  submit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const newPassword = this.passwordControl.value;
    this.loading = true;

    this._authService.resetPassword(this.email, newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        this._notificationsService.showSuccess('Success', 'Password reset successfully. Please login.');
        // Clean up reset details from auth service
        this._authService.setResetEmail('');
        this._authService.setVerifiedCode('');
        this._router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this._notificationsService.showError(
          'Error',
          err.error?.message || 'Failed to reset password. The code might have expired.'
        );
      },
    });
  }
}
