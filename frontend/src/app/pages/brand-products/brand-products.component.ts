import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BrandModel } from '../../core/models/brand/brand.model';
import { ProductModel } from '../../core/models/products/product.model';
import { BrandService } from '../../core/service/brand.service';
import { ProductsService } from '../../core/service/products.service';
import { CartService } from '../../core/service/cart.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-brand-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './brand-products.component.html',
  styleUrls: [],
})
export class BrandProductsComponent implements OnInit {
  brandId: string = '';
  brand: BrandModel | null = null;
  products: ProductModel[] = [];
  loading: boolean = true;
  error: string = '';
  wishlistIds: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private _brandService: BrandService,
    private _productsService: ProductsService,
    private _cartService: CartService,
    private _wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.brandId = params.get('id') || '';
      if (this.brandId) {
        this.loadBrandAndProducts();
      }
    });

    if (typeof window !== 'undefined' && localStorage.getItem('userToken')) {
      this._wishlistService.getWishlist().subscribe({
        next: (res: any) => {
          const list = res.data || [];
          list.forEach((item: any) => {
            const id = typeof item === 'string' ? item : item._id || item.id;
            if (id) this.wishlistIds.add(id);
          });
        },
        error: () => {}
      });
    }
  }

  loadBrandAndProducts(): void {
    this.loading = true;
    this.error = '';

    // Fetch Brand info
    this._brandService.getBrand(this.brandId).subscribe({
      next: (res) => {
        this.brand = res.data;
      },
      error: () => {
        // If single brand endpoint fails, continue loading products
      }
    });

    // Fetch Products with brandId filter
    this._productsService.getProducts({ brandId: this.brandId, limit: 50 }).subscribe({
      next: (res) => {
        this.products = (res.products || []).map((p: ProductModel) => ({
          ...p,
          isAddedToCart: this._cartService.isAddedToCart(p) || false,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching brand products:', err);
        this.error = 'Failed to load products for this brand.';
        this.loading = false;
      }
    });
  }

  addToCart(product: ProductModel): void {
    this._cartService.addToCart(product);
  }

  toggleWishlist(product: ProductModel, event: Event): void {
    event.stopPropagation();
    const id = product.id;
    if (this.wishlistIds.has(id)) {
      this._wishlistService.removeFromWishlist(id).subscribe({
        next: () => this.wishlistIds.delete(id)
      });
    } else {
      this._wishlistService.addToWishlist(id).subscribe({
        next: () => this.wishlistIds.add(id)
      });
    }
  }

  isInWishlist(id: string): boolean {
    return this.wishlistIds.has(id);
  }
}
