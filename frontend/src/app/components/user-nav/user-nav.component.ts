import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { CartService } from '../../core/service/cart.service';
import { UserDataService } from '../../core/service/user-data.service';
import { AuthService } from './../../core/service/auth.service';
import { NotificationService } from '../../core/service/notification.service';
import { NotificationModel } from '../../core/models/notification/notification.model';

@Component({
  selector: 'app-user-nav',
  standalone: true,
  imports: [
    MenubarModule,
    BadgeModule,
    AvatarModule,
    InputTextModule,
    RippleModule,
    CommonModule,
    RouterLink,
  ],
  templateUrl: './user-nav.component.html',
  styleUrl: './user-nav.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class UserNavComponent implements OnInit {
  items: MenuItem[] | undefined;
  logOut: boolean = false;
  username: string = '';
  cartCount: number = 0;
  isLoggedIn: boolean = false;
  unreadNotificationsCount: number = 0;
  notificationsList: NotificationModel[] = [];
  showNotificationsDropdown: boolean = false;

  constructor(
    private _userData: UserDataService,
    private _cart: CartService,
    private _auth: AuthService,
    private _notification: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getUserName();
    this.getUserCartCount();
    
    // Subscribe to dynamic auth state
    this._auth.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.buildMenu();
    });

    // Subscribe to real-time notification badge counter
    this._notification.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });

    this._notification.notifications$.subscribe((list) => {
      this.notificationsList = list;
    });
  }

  buildMenu(): void {
    const baseItems: MenuItem[] = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        path: 'home',
      },
      {
        label: 'Products',
        icon: 'pi pi-sparkles',
        path: 'products',
      },
      {
        label: 'Categories',
        icon: 'pi pi-th-large',
        path: 'categories',
      },
    ];

    if (this.isLoggedIn) {
      this.items = [
        ...baseItems,
        {
          label: 'Profile',
          icon: 'pi pi-user',
          path: 'profile',
        },
      ];
    } else {
      this.items = [
        ...baseItems,
        {
          label: 'Login',
          icon: 'pi pi-sign-in',
          path: 'login',
        },
        {
          label: 'Register',
          icon: 'pi pi-user-plus',
          path: 'register',
        },
      ];
    }
  }

  getUserName(): void {
    this._userData.userName.subscribe((next) => {
      this.username = next || typeof window !== 'undefined' ? localStorage.getItem('username') || '' : '';
    });
  }

  getUserCartCount(): void {
    this._cart.countOfCart.subscribe((next) => (this.cartCount = next));
  }

  toggleNotifications(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.logOut = false; // Close user menu
    }
  }

  markNotificationsRead(): void {
    this._notification.markAllAsRead();
  }

  logout(): void {
    this.showNotificationsDropdown = false;
    this.logOut = false;
    this._auth.logout();
  }
}
