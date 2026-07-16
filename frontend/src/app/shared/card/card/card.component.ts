import { NgClass, CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { ProductModel } from '../../../core/models/products/product.model';
import { CartService } from '../../../core/service/cart.service';
import { WishlistService } from '../../../core/service/wishlist.service';
import { AuthService } from '../../../core/service/auth.service';
import { NotifecationsService } from '../../../core/service/notifecations.service';
import { EmptyComponent } from '../../empty/empty.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgClass, CommonModule, ButtonModule, RouterLink, MessagesModule, EmptyComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnInit {
  isAddedToCart: boolean = false;
  @Input({ required: true }) isSmallCard: boolean = false;
  @Input({ required: true }) Products!: ProductModel[];
  @Input() searchKey: string = '';

  wishlistProductIds = new Set<string>();

  constructor(
    private _cartService: CartService,
    private _wishlist: WishlistService,
    private _auth: AuthService,
    private _toast: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    if (this._auth.authorized()) {
      this._wishlist.getWishlist().subscribe({
        next: (res) => {
          const items = res.data || [];
          items.forEach((item: any) => {
            const id = item._id || item.id;
            if (id) this.wishlistProductIds.add(id);
          });
        },
        error: (err) => {
          console.warn('Failed to load card wishlist state:', err);
        }
      });
    }
  }

  addToCart(product: ProductModel) {
    this._cartService.addToCart(product);
  }

  toggleWishlist(product: ProductModel, event: Event): void {
    event.stopPropagation();
    if (!this._auth.authorized()) {
      this._toast.showError('Authentication Required', 'Please log in to add items to your favorites.');
      return;
    }

    const productId = product.id || (product as any)._id;
    if (!productId) return;

    if (this.wishlistProductIds.has(productId)) {
      this._wishlist.removeFromWishlist(productId).subscribe({
        next: () => {
          this.wishlistProductIds.delete(productId);
          this._toast.showSuccess('Success', 'Removed from favorites.');
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to remove from wishlist.');
        }
      });
    } else {
      this._wishlist.addToWishlist(productId).subscribe({
        next: () => {
          this.wishlistProductIds.add(productId);
          this._toast.showSuccess('Success', 'Added to favorites.');
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to add to wishlist.');
        }
      });
    }
  }
}
