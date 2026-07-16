import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { CartService } from './cart.service';
import { UserDataService } from './user-data.service';
import { RegisterRequestModel } from '../models/auth/register-request.model';
import { RegisterResponseModel } from '../models/auth/register-response.model';
import { LoginRequestModel } from '../models/auth/login-request.model';
import { LoginResponseModel } from '../models/auth/login-response.model';
import { ForgotRequestModel } from '../models/auth/forgot-request.model';
import { ForgotResponseModel } from '../models/auth/forgot-response.model';
import { VerifyResetCodeRequestModel } from '../models/auth/verify-reset-code-request.model';
import { VerifyResetCodeResponseModel } from '../models/auth/verify-reset-code-response.model';
import { ResetPasswordRequestModel } from '../models/auth/reset-password-request.model';
import { ResetPasswordResponseModel } from '../models/auth/reset-password-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn$ = new BehaviorSubject<boolean>(this.authorized());
  constructor(
    private _httpClient: HttpClient,
    private router: Router,
    private _userData: UserDataService,
    private _cart: CartService
  ) {}

  saveSession(token: string, username: string, role: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', role);
    }
    this._userData.userName.next(username);
    this.isLoggedIn$.next(true);
    this._cart.syncCartCount();
  }

  register(registerData: RegisterRequestModel): Observable<RegisterResponseModel> {
    const body = {
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      passwordConfirm: registerData.rePassword,
    };
    return this._httpClient.post<RegisterResponseModel>(API_ENDPOINTS.SIGNUP, body);
  }

  login(loginUser: LoginRequestModel): Observable<LoginResponseModel> {
    return this._httpClient.post<LoginResponseModel>(API_ENDPOINTS.LOGIN, loginUser);
  }

  authorized(): boolean {
    if (typeof window !== 'undefined' && localStorage.getItem('token') != null) {
      return true;
    }
    return false;
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  getUserRole(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || 'user';
    }
    return 'user';
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'manager';
  }

  private resetEmail: string = '';
  private verifiedCode: string = '';

  setResetEmail(email: string) {
    this.resetEmail = email;
  }

  getResetEmail() {
    return this.resetEmail;
  }

  setVerifiedCode(code: string) {
    this.verifiedCode = code;
  }

  getVerifiedCode() {
    return this.verifiedCode;
  }

  requestResetCode(email: string): Observable<ForgotResponseModel> {
    const body: ForgotRequestModel = { email };
    return this._httpClient.post<ForgotResponseModel>(API_ENDPOINTS.FORGOT_PASSWORD, body);
  }

  verifyResetCode(resetCode: string): Observable<VerifyResetCodeResponseModel> {
    const body: VerifyResetCodeRequestModel = { resetCode };
    return this._httpClient.post<VerifyResetCodeResponseModel>(API_ENDPOINTS.VERIFY_RESET_CODE, body);
  }

  resetPassword(email: string, newPassword: string): Observable<ResetPasswordResponseModel> {
    const body: ResetPasswordRequestModel = { email, newPassword };
    return this._httpClient.put<ResetPasswordResponseModel>(API_ENDPOINTS.RESET_PASSWORD, body);
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      localStorage.removeItem('cartState');
    }
    this._userData.userName.next('');
    this._cart.countOfCart.next(0);
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }
}
