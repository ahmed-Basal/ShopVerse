import { Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginRequestModel } from '../../core/models/auth/login-request.model';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { UserDataService } from '../../core/service/user-data.service';
import { SharedModule } from '../../shared/module/shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  email!: FormControl;
  password!: FormControl;
  loginForm!: FormGroup;
  loading = false;

  constructor(
    private authService_: AuthService,
    private _notifecationsService: NotifecationsService,
    private router: Router,
    private _userData: UserDataService
  ) {
    this.initFormControls();
    this.initFormGroupe();
  }

  initFormControls(): void {
    this.email = new FormControl('', [Validators.required, Validators.email]);
    this.password = new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]);
  }

  initFormGroupe(): void {
    this.loginForm = new FormGroup({
      email: this.email,
      password: this.password,
    });
  }

  submit() {
    if (this.loginForm.valid) {
      this.siginIn(this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
      Object.keys(this.loginForm.controls).forEach((control) =>
        this.loginForm.controls[control].markAsDirty()
      );
    }
  }

  siginIn(data: LoginRequestModel): void {
    this.loading = true;
    this.authService_.login(data).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.token) {
          this._notifecationsService.showSuccess('success', 'success login');
          const userName = response.data?.name || '';
          const userRole = response.data?.role || 'user';
          this.authService_.saveSession(response.token, userName, userRole);

          if (userRole === 'admin' || userRole === 'manager') {
            this.router.navigate(['dashboard']);
          } else {
            this.router.navigate(['home']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this._notifecationsService.showError(
          'Error',
          err.error?.message || err.error?.error || 'Login failed'
        );
      },
    });
  }
}
