import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { SharedModule } from '../../shared/module/shared/shared.module';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterLink],
  templateUrl: './verify-code.component.html',
  styleUrl: './verify-code.component.scss',
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
  verifyForm!: FormGroup;
  codeControl!: FormControl;
  email = '';
  loading = false;
  
  // Resend cooldown timer
  cooldown = 0;
  timerSub?: Subscription;

  constructor(
    private _authService: AuthService,
    private _notificationsService: NotifecationsService,
    private _router: Router
  ) {
    this.codeControl = new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^\d+$/) // numbers only
    ]);
    this.verifyForm = new FormGroup({
      code: this.codeControl,
    });
  }

  ngOnInit(): void {
    this.email = this._authService.getResetEmail();
    if (!this.email) {
      this._notificationsService.showWarn('Warning', 'Please enter your email first');
      this._router.navigate(['/forgot-password']);
      return;
    }
    this.startCooldown();
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
  }

  startCooldown(): void {
    this.cooldown = 60;
    this.timerSub?.unsubscribe();
    this.timerSub = timer(0, 1000).subscribe(() => {
      if (this.cooldown > 0) {
        this.cooldown--;
      } else {
        this.timerSub?.unsubscribe();
      }
    });
  }

  resendCode(): void {
    if (this.cooldown > 0) return;

    this.loading = true;
    this._authService.requestResetCode(this.email).subscribe({
      next: () => {
        this.loading = false;
        this._notificationsService.showSuccess(
          'Success',
          'If this email is registered with us, a new reset code has been sent.'
        );
        this.startCooldown();
      },
      error: (err) => {
        this.loading = false;
        this._notificationsService.showError('Error', err.error?.message || 'Failed to resend code');
      },
    });
  }

  submit() {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const code = this.codeControl.value;
    this.loading = true;

    this._authService.verifyResetCode(code).subscribe({
      next: (response) => {
        this.loading = false;
        this._notificationsService.showSuccess('Success', 'Code verified successfully');
        this._authService.setVerifiedCode(code);
        this._router.navigate(['/reset-password']);
      },
      error: (err) => {
        this.loading = false;
        this._notificationsService.showError(
          'Error',
          err.error?.message || 'Invalid or expired verification code'
        );
      },
    });
  }
}
