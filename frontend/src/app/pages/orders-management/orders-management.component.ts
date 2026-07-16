import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../core/service/dashboard.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { OrderModel } from '../../core/models/orders/order.model';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-management.component.html',
  styleUrl: './orders-management.component.scss',
})
export class OrdersManagementComponent implements OnInit {
  orders: OrderModel[] = [];
  loading = false;

  constructor(
    private _dashboardService: DashboardService,
    private _notifecationsService: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this._dashboardService.getOrders(1, 100).subscribe({
      next: (res) => {
        this.orders = res.data;
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load orders');
        this.loading = false;
      },
    });
  }

  markAsPaid(id: string): void {
    this.loading = true;
    this._dashboardService.updateOrderToPaid(id).subscribe({
      next: () => {
        this._notifecationsService.showSuccess('Success', 'Order marked as paid');
        this.loadOrders();
      },
      error: (err) => {
        this._notifecationsService.showError('Error', err.error?.message || 'Failed to update order');
        this.loading = false;
      },
    });
  }

  markAsDelivered(id: string): void {
    this.loading = true;
    this._dashboardService.updateOrderToDelivered(id).subscribe({
      next: () => {
        this._notifecationsService.showSuccess('Success', 'Order marked as delivered');
        this.loadOrders();
      },
      error: (err) => {
        this._notifecationsService.showError('Error', err.error?.message || 'Failed to update order');
        this.loading = false;
      },
    });
  }
}
