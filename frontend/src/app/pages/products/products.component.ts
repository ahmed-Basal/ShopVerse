import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs/operators';
import { ProductModel } from '../../core/models/products/product.model';
import { CartService } from '../../core/service/cart.service';
import { ProductsService } from '../../core/service/products.service';
import { CardComponent } from '../../shared/card/card/card.component';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import {
  SortDropdownComponent,
  SortOption,
} from '../../shared/sort-dropdown/sort-dropdown.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    SearchBarComponent,
    SortDropdownComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit, OnDestroy {
  allProducts: ProductModel[] = [];
  searchKey: string = '';
  loading = false;
  error = '';

  // BehaviorSubjects seeded from URL on init
  search$ = new BehaviorSubject<string>('');
  sort$ = new BehaviorSubject<string>('-createdAt');

  private productsSub?: Subscription;
  private routeSub?: Subscription;

  sortOptions: SortOption[] = [
    { label: 'Newest', value: '-createdAt' },
    { label: 'Oldest', value: 'createdAt' },
    { label: 'Name A-Z', value: 'title' },
    { label: 'Name Z-A', value: '-title' },
    { label: 'Price Low-to-High', value: 'price' },
    { label: 'Price High-to-Low', value: '-price' },
  ];

  constructor(
    private _productsService: ProductsService,
    private _cart: CartService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit(): void {
    // ── Step 1: Seed state from URL query params (fires once on init) ──
    this.routeSub = this._route.queryParams.subscribe((params) => {
      const keyword = params['keyword'] ?? '';
      const sort = params['sort'] ?? '-createdAt';

      // Only push if they differ from current value (avoids double-firing)
      if (keyword !== this.search$.value) {
        this.searchKey = keyword;
        this.search$.next(keyword);
      }
      if (sort !== this.sort$.value) {
        this.sort$.next(sort);
      }
    });

    // ── Step 2: Combine search + sort → single API call ──
    this.productsSub = combineLatest([
      this.search$.pipe(debounceTime(350), distinctUntilChanged()),
      this.sort$.pipe(distinctUntilChanged()),
    ])
      .pipe(
        tap(() => {
          this.loading = true;
          this.error = '';
        }),
        switchMap(([keyword, sort]) =>
          this._productsService.getProducts({
            keyword: keyword.trim(),
            sort,
          })
        )
      )
      .subscribe({
        next: (response) => {
          this.allProducts = (response.products || []).map(
            (product: ProductModel) => ({
              ...product,
              isAddedToCart: this._cart.isAddedToCart(product) || false,
            })
          );
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load products. Please try again.';
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.productsSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  // ── Push new keyword into URL (ActivatedRoute subscription will react) ──
  onSearch(keyword: string): void {
    this.searchKey = keyword;
    this._updateUrl({ keyword: keyword || null });
  }

  // ── Push new sort into URL ──
  onSortChange(value: string): void {
    this._updateUrl({ sort: value === '-createdAt' ? null : value });
  }

  retry(): void {
    // Re-emit current values to trigger a fresh API call
    this.search$.next(this.search$.value);
  }

  // ── Single helper: merges params and navigates (null = remove from URL) ──
  private _updateUrl(changes: Record<string, string | null>): void {
    const current = { ...this._route.snapshot.queryParams };

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') {
        delete current[key];
      } else {
        current[key] = value;
      }
    }

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: current,
      replaceUrl: true, // replace history entry so back-button is clean
    });
  }
}
