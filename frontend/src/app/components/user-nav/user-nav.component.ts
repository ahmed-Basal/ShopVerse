import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../core/service/cart.service';
import { UserDataService } from '../../core/service/user-data.service';
import { AuthService } from '../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';
import { NotificationModel } from '../../core/models/notification/notification.model';

@Component({
  selector: 'app-user-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './user-nav.component.html',
  styleUrls: [],
})
export class UserNavComponent implements OnInit {
  username: string = '';
  userRole: string = '';
  isAdmin: boolean = false;
  cartCount: number = 0;
  isLoggedIn: boolean = false;
  unreadNotificationsCount: number = 0;
  notificationsList: NotificationModel[] = [];
  showNotificationsDropdown: boolean = false;
  showUserMenu: boolean = false;
  mobileMenuOpen: boolean = false;

  constructor(
    private _userData: UserDataService,
    private _cart: CartService,
    private _auth: AuthService,
    private _notification: NotificationService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    this.showUserMenu = false;
    this.showNotificationsDropdown = false;
  }

  ngOnInit() {
    this.getUserName();
    this.getUserCartCount();

    this._auth.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.syncUserRole();
    });

    this._notification.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });

    this._notification.notifications$.subscribe((list) => {
      this.notificationsList = list;
    });
  }

  syncUserRole(): void {
    if (typeof window !== 'undefined') {
      this.userRole = localStorage.getItem('userRole') || 'customer';
      this.isAdmin = this.userRole === 'admin' || this.userRole === 'manager';
    }
  }

  getUserName(): void {
    this._userData.userName.subscribe((next) => {
      this.username = next || (typeof window !== 'undefined' ? localStorage.getItem('username') || '' : '');
      this.syncUserRole();
    });
  }

  getUserCartCount(): void {
    this._cart.countOfCart.subscribe((next) => (this.cartCount = next));
  }

  toggleUserMenu(event?: Event): void {
    if (event) event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotificationsDropdown = false;
    }
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  toggleNotifications(event?: Event): void {
    if (event) event.stopPropagation();
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.showUserMenu = false;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  markNotificationsRead(): void {
    this._notification.markAllAsRead();
  }

  logout(): void {
    this.showNotificationsDropdown = false;
    this.showUserMenu = false;
    this.mobileMenuOpen = false;
    this._auth.logout();
    this.router.navigate(['/login']);
  }
}
