import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { UserDataService } from '../../core/service/user-data.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  username: string = '';
  sidebarOpen: boolean = true;

  constructor(
    private _userData: UserDataService,
    private _auth: AuthService,
    private router: Router
  ) {
    this._userData.userName.subscribe((name) => (this.username = name));
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this._auth.logout();
  }
}
