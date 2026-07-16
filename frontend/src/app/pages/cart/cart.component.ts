import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/service/cart.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { CheckoutFormComponent } from '../../shared/checkout-form/checkout-form.component';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [DataViewModule, ButtonModule, TagModule, CommonModule, CheckoutFormComponent, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalCartPrice: number = 0;
  totalPriceAfterDiscount: number = 0;
  cartId: string = '';
  loading = false;
  showCheckoutModal = false;

  couponCode: string = '';
  couponError: string = '';
  couponLoading: boolean = false;

  constructor(
    private _cartService: CartService,
    private _notifecationsService: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this._cartService.getCart().subscribe({
      next: (res) => {
        this.cartItems = res.data?.cartItems || [];
        this.totalCartPrice = res.data?.totalCartPrice || 0;
        this.totalPriceAfterDiscount = res.data?.totalPriceAfterDiscount || 0;
        this.cartId = res.data?._id || '';
        this.loading = false;
      },
      error: (err) => {
        this._notifecationsService.showError('Error', err.error?.message || 'Failed to load your cart.');
        this.loading = false;
      }
    });
  }

  updateQuantity(itemId: string, currentQty: number, increment: boolean): void {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;

    this.loading = true;
    this._cartService.updateQuantity(itemId, newQty).subscribe({
      next: () => {
        this.loadCart();
      },
      error: (err) => {
        this._notifecationsService.showError('Error', err.error?.message || 'Failed to update quantity.');
        this.loading = false;
      }
    });
  }

  removeItem(itemId: string): void {
    if (confirm('Remove this item from your cart?')) {
      this.loading = true;
      this._cartService.removeCartItem(itemId).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Item removed from cart.');
          this.loadCart();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to remove item.');
          this.loading = false;
        }
      });
    }
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.loading = true;
      this._cartService.clearCart().subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Cart cleared successfully.');
          this.cartItems = [];
          this.totalCartPrice = 0;
          this.totalPriceAfterDiscount = 0;
          this.loading = false;
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to clear cart.');
          this.loading = false;
        }
      });
    }
  }

  openCheckout(): void {
    if (this.cartItems.length === 0) {
      this._notifecationsService.showWarn('Empty Cart', 'Please add items to your cart first.');
      return;
    }
    this.showCheckoutModal = true;
  }

  closeCheckout(): void {
    this.showCheckoutModal = false;
  }

  onCheckoutSubmit(event: { shippingAddress: any; paymentMethod: string }): void {
    this.showCheckoutModal = false;
    this.loading = true;

    if (event.paymentMethod === 'cash') {
      const http = (this._cartService as any)._httpClient;
      http.post(`http://localhost:8000/api/v1/orders/${this.cartId}`, {
        shippingAddress: event.shippingAddress
      }).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Order placed successfully! We will contact you soon.');
          this.cartItems = [];
          this.totalCartPrice = 0;
          this.totalPriceAfterDiscount = 0;
          this._cartService.countOfCart.next(0);
          this.loading = false;
        },
        error: (err: any) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to place cash order.');
          this.loading = false;
        }
      });
    } else {
      const http = (this._cartService as any)._httpClient;
      http.post(`http://localhost:8000/api/v1/orders/checkout-session/${this.cartId}`, {
        shippingAddress: event.shippingAddress
      }).subscribe({
        next: (res: any) => {
          if (res.session && res.session.url) {
            this._cartService.countOfCart.next(0);
            window.location.href = res.session.url;
          } else {
            this._notifecationsService.showError('Error', 'Failed to generate Stripe checkout session.');
            this.loading = false;
          }
        },
        error: (err: any) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to initialize payment.');
          this.loading = false;
        }
      });
    }
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = 'Please enter a coupon code.';
      return;
    }

    this.couponLoading = true;
    this.couponError = '';

    this._cartService.applyCoupon(this.couponCode.trim()).subscribe({
      next: (res) => {
        this.totalPriceAfterDiscount = res.data?.totalPriceAfterDiscount || 0;
        this.totalCartPrice = res.data?.totalCartPrice || 0;
        this._notifecationsService.showSuccess('Success', 'Coupon applied successfully!');
        this.couponLoading = false;
        this.couponCode = ''; // Reset input field
      },
      error: (err) => {
        this.couponError = err.error?.message || 'Coupon is invalid or expired';
        this._notifecationsService.showError('Error', this.couponError);
        this.couponLoading = false;
      }
    });
  }
}
