import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/service/dashboard.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  stats: any = {};
  loading = true;
  error = '';

  constructor(private _dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this._dashboardService.getStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard stats';
        this.loading = false;
        // Set default values so dashboard still renders
        this.stats = {
          usersCount: 0,
          productsCount: 0,
          ordersCount: 0,
          categoriesCount: 0,
          totalRevenue: 0,
          recentOrders: [],
        };
      },
    });
  }
}
