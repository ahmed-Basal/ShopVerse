import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { NotifecationsService } from './notifecations.service';
import { ProductModel } from '../models/products/product.model';
import { CartResponseModel } from '../models/cart/cart-response.model';
import { CartAddRequestModel } from '../models/cart/cart-add-request.model';
import { CartUpdateQuantityRequestModel } from '../models/cart/cart-update-quantity-request.model';
import { CartApplyCouponRequestModel } from '../models/cart/cart-apply-coupon-request.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  countOfCart = new BehaviorSubject<number>(0);
  cartId = new BehaviorSubject<string>('');
  private cartProductIds: string[] = [];

  constructor(
    private _httpClient: HttpClient,
    private _notifecationsService: NotifecationsService
  ) {
    if (typeof window !== 'undefined' && localStorage.getItem('token') !== null) {
      this.syncCartCount();
    }
  }

  syncCartCount(): void {
    this.getCart().subscribe({
      next: (res) => {
        this.countOfCart.next(res.numOfCartItems || 0);
        if (res.data && res.data._id) {
          this.cartId.next(res.data._id);
          this.cartProductIds = (res.data.cartItems || []).map((item) => {
            return (item.product && typeof item.product === 'object' ? item.product._id : item.product) || '';
          });
        }
      },
      error: () => {
        this.countOfCart.next(0);
        this.cartProductIds = [];
      }
    });
  }

  getCart(): Observable<CartResponseModel> {
    return this._httpClient.get<CartResponseModel>(API_ENDPOINTS.CART).pipe(
      tap((res) => {
        if (res.data && res.data._id) {
          this.cartId.next(res.data._id);
          this.cartProductIds = (res.data.cartItems || []).map((item) => {
            return (item.product && typeof item.product === 'object' ? item.product._id : item.product) || '';
          });
        }
      })
    );
  }

  addToCart(product: ProductModel, color: string = 'Default') {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('token') !== null;
    if (!hasToken) {
      this._notifecationsService.showWarn('Authentication Required', 'Please log in to add items to your cart.');
      return;
    }

    const body: CartAddRequestModel = {
      productId: product.id,
      color: color
    };

    this._httpClient.post<CartResponseModel>(API_ENDPOINTS.CART, body).subscribe({
      next: (res) => {
        this._notifecationsService.showSuccess('Success', 'Item added to cart successfully');
        this.countOfCart.next(res.numOfCartItems || 0);
        if (res.data && res.data._id) {
          this.cartId.next(res.data._id);
        }
        this.cartProductIds.push(product.id);
        product.isAddedToCart = true;
      },
      error: (err) => {
        this._notifecationsService.showError('Error', err.error?.message || 'Failed to add item to cart.');
      }
    });
  }

  updateQuantity(itemId: string, quantity: number): Observable<CartResponseModel> {
    const body: CartUpdateQuantityRequestModel = { quantity };
    return this._httpClient.put<CartResponseModel>(`${API_ENDPOINTS.CART}/${itemId}`, body).pipe(
      tap((res) => {
        this.countOfCart.next(res.numOfCartItems || 0);
      })
    );
  }

  removeCartItem(itemId: string): Observable<CartResponseModel> {
    return this._httpClient.delete<CartResponseModel>(`${API_ENDPOINTS.CART}/${itemId}`).pipe(
      tap((res) => {
        this.countOfCart.next(res.numOfCartItems || 0);
        // Refresh product ID cache
        this.syncCartCount();
      })
    );
  }

  clearCart(): Observable<void> {
    return this._httpClient.delete<void>(API_ENDPOINTS.CART).pipe(
      tap(() => {
        this.countOfCart.next(0);
        this.cartId.next('');
        this.cartProductIds = [];
      })
    );
  }

  isAddedToCart(product: ProductModel): boolean {
    return this.cartProductIds.includes(product.id);
  }

  applyCoupon(coupon: string): Observable<CartResponseModel> {
    const body: CartApplyCouponRequestModel = { coupon };
    return this._httpClient.put<CartResponseModel>(`${API_ENDPOINTS.CART}/applyCoupon`, body);
  }
}
