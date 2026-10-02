import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { ProductModel } from '../../core/models/products/product.model';
import { CategoryService } from '../../core/service/category.service';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { ProductsService } from '../../core/service/products.service';
import { CartService } from '../../core/service/cart.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './category-detail.component.html',
  styleUrls: [],
})
export class CategoryDetailComponent implements OnInit {
  categoryId: string = '';
  category: CategoryModel | null = null;
  subcategories: SubcategoryModel[] = [];
  selectedSubcategoryId: string | null = null;
  products: ProductModel[] = [];
  loading: boolean = true;
  error: string = '';
  wishlistIds: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private _categoryService: CategoryService,
    private _subcatService: SubcategoryService,
    private _productsService: ProductsService,
    private _cartService: CartService,
    private _wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.categoryId = params.get('id') || '';
      if (this.categoryId) {
        this.loadCategoryData();
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

  loadCategoryData(): void {
    this.loading = true;
    this.error = '';

    // Fetch Category info
    this._categoryService.getCategory(this.categoryId).subscribe({
      next: (res: any) => {
        this.category = res.data;
      },
      error: () => {}
    });

    // Fetch Subcategories for this category
    this._subcatService.getSubcategoriesByCategory(this.categoryId).subscribe({
      next: (res) => {
        this.subcategories = res.data || [];
      },
      error: () => {}
    });

    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading = true;
    const filter: any = { categoryId: this.categoryId, limit: 50 };
    if (this.selectedSubcategoryId) {
      filter.subCategoryId = this.selectedSubcategoryId;
    }

    this._productsService.getProducts(filter).subscribe({
      next: (res) => {
        this.products = (res.products || []).map((p: ProductModel) => ({
          ...p,
          isAddedToCart: this._cartService.isAddedToCart(p) || false,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching category products:', err);
        this.error = 'Failed to load products.';
        this.loading = false;
      }
    });
  }

  selectSubcategory(subId: string | null): void {
    this.selectedSubcategoryId = subId;
    this.fetchProducts();
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
