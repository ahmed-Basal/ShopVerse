import { Component, ViewEncapsulation } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { RegisterRequestModel } from '../../core/models/auth/register-request.model';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { UserDataService } from '../../core/service/user-data.service';
import { SharedModule } from '../../shared/module/shared/shared.module';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent {
  name!: FormControl;
  email!: FormControl;
  password!: FormControl;
  rePassword!: FormControl;
  registrationForm!: FormGroup;
  isRegisterd: boolean = false;
  loading = false;

  constructor(
    private _authService: AuthService,
    private _notifecationsService: NotifecationsService,
    private _router: Router,
    private _userData: UserDataService
  ) {
    this.initFormControls();
    this.initFormGroupe();
  }

  initFormControls(): void {
    this.name = new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]);
    this.email = new FormControl('', [Validators.required, Validators.email]);
    this.password = new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]);
    this.rePassword = new FormControl('', [
      Validators.required,
      this.passwordMatch(this.password),
    ]);
  }

  initFormGroupe(): void {
    this.registrationForm = new FormGroup({
      name: this.name,
      email: this.email,
      password: this.password,
      rePassword: this.rePassword,
    });
  }

  passwordMatch(pass: AbstractControl): ValidatorFn {
    return (rePass: AbstractControl): null | { [key: string]: boolean } => {
      if (pass.value !== rePass.value || rePass.value === '') {
        return { passNotMatch: true };
      } else return null;
    };
  }

  submit() {
    if (this.registrationForm.valid) {
      this.siginUp(this.registrationForm.value);
    } else {
      this.registrationForm.markAllAsTouched();
      Object.keys(this.registrationForm.controls).forEach((control) =>
        this.registrationForm.controls[control].markAsDirty()
      );
    }
  }

  siginUp(data: RegisterRequestModel): void {
    this.loading = true;
    this._authService.register(data).subscribe({
      next: (response) => {
        this.loading = false;
        this.isRegisterd = true;
        if (response.token) {
          this._notifecationsService.showSuccess('success', 'success register');
          localStorage.setItem('token', response.token);
          const userName = response.data?.name || '';
          const userRole = response.data?.role || 'user';
          this._userData.userName.next(userName);
          localStorage.setItem('username', userName);
          localStorage.setItem('userRole', userRole);
          this._router.navigate(['home']);
        }
      },
      error: (err) => {
        this.loading = false;
        this._notifecationsService.showError(
          'Error',
          err.error?.message || err.error?.errors?.[0]?.msg || 'Registration failed'
        );
      },
    });
  }
}
