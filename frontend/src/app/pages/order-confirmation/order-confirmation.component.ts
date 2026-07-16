import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrdersService } from '../../core/service/orders.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { RouterLink } from '@angular/router';
import { OrderModel } from '../../core/models/orders/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss'
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  loading = true;
  paymentConfirmed = false;
  latestOrder: OrderModel | null = null;
  pollInterval: any = null;
  pollCount = 0;

  constructor(
    private _orders: OrdersService,
    private _toast: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.verifyPayment();
  }

  verifyPayment(): void {
    this.pollCount = 0;
    this.pollStatus();
    
    // Poll up to 5 times (every 3 seconds) waiting for Stripe webhook to write card order
    this.pollInterval = setInterval(() => {
      this.pollCount++;
      if (this.pollCount >= 5 || this.paymentConfirmed) {
        clearInterval(this.pollInterval);
        this.loading = false;
      } else {
        this.pollStatus();
      }
    }, 3000);
  }

  pollStatus(): void {
    this._orders.getOrders().subscribe({
      next: (res) => {
        const orderList = res.data || [];
        if (orderList.length > 0) {
          this.latestOrder = orderList[0];
          
          const orderTime = new Date(this.latestOrder.createdAt || this.latestOrder.updatedAt || Date.now()).getTime();
          const now = Date.now();
          const isRecent = (now - orderTime) < 120000; // 2 minutes

          if (this.latestOrder.isPaid && isRecent) {
            this.paymentConfirmed = true;
            this.loading = false;
            clearInterval(this.pollInterval);
            this._toast.showSuccess('Payment Confirmed!', 'Your Stripe payment was successfully verified.');
          }
        } else {
          // If no orders at all, stop loading after polling finishes
        }
      },
      error: (err) => {
        console.error('Error fetching order status:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
