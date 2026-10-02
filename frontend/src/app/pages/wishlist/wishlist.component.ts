import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/service/wishlist.service';
import { CartService } from '../../core/service/cart.service';
import { ProductModel } from '../../core/models/products/product.model';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './wishlist.component.html',
  styleUrls: [],
})
export class WishlistComponent implements OnInit {
  wishlistItems: ProductModel[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private _wishlistService: WishlistService,
    private _cartService: CartService
  ) {}

  ngOnInit(): void {
    this.fetchWishlist();
  }

  fetchWishlist(): void {
    this.loading = true;
    this.error = '';
    this._wishlistService.getWishlist().subscribe({
      next: (res: any) => {
        this.wishlistItems = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching wishlist:', err);
        this.error = 'Failed to load your wishlist.';
        this.loading = false;
      }
    });
  }

  removeFromWishlist(id: string | undefined): void {
    if (!id) return;
    this._wishlistService.removeFromWishlist(id).subscribe({
      next: () => {
        this.wishlistItems = this.wishlistItems.filter((item) => (item.id || item._id) !== id);
      },
      error: (err) => console.error('Error removing item from wishlist:', err)
    });
  }

  moveToCart(product: ProductModel): void {
    this._cartService.addToCart(product);
  }
}
