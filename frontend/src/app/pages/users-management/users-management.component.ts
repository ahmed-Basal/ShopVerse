import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/service/dashboard.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { UserModel } from '../../core/models/auth/user.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent implements OnInit {
  users: UserModel[] = [];
  loading = false;

  constructor(
    private _dashboardService: DashboardService,
    private _notifecationsService: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this._dashboardService.getUsers(1, 100).subscribe({
      next: (res) => {
        this.users = res.data;
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load users list');
        this.loading = false;
      },
    });
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to deactivate/delete this user?')) {
      this.loading = true;
      this._dashboardService.deleteUser(id).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'User deleted successfully');
          this.loadUsers();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete user');
          this.loading = false;
        },
      });
    }
  }
}
