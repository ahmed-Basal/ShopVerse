import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GalleriaModule } from 'primeng/galleria';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { ProductModel } from '../../core/models/products/product.model';
import { CartService } from '../../core/service/cart.service';
import { ProductsService } from '../../core/service/products.service';

interface CouponState {
  discountedPrice?: number;
  discountPercent?: number;
  errorMsg?: string;
  loading?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    GalleriaModule,
    PaginatorModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  // Static Galleria images
  images: any[] | undefined;

  // Products state
  productsList: ProductModel[] = [];
  totalProducts = 0;
  loading = false;
  error = '';

  // RxJS subjects for unified data flow
  search$ = new BehaviorSubject<string>('');
  sort$ = new BehaviorSubject<string>('-createdAt');
  page$ = new BehaviorSubject<number>(1);
  limit$ = new BehaviorSubject<number>(4); // page size (default 4)

  // Coupon inputs and active state per product
  couponInputs: { [productId: string]: string } = {};
  couponStates: { [productId: string]: CouponState } = {};

  private subscriptions = new Subscription();

  sortOptions = [
    { label: 'Newest', value: '-createdAt' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Top Rated', value: '-ratingsAverage' }
  ];

  constructor(
    private _productsService: ProductsService,
    private _cart: CartService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit(): void {
    // Initialize Galleria carousel images
    this.images = [
      {
        itemImageSrc: './assets/product-1.jpg',
        alt: 'Featured hot product 1',
        title: 'Hot Sale 1',
      },
      {
        itemImageSrc: './assets/product-2.jpg',
        alt: 'Featured hot product 2',
        title: 'Hot Sale 2',
      },
      {
        itemImageSrc: './assets/product-3.jpg',
        alt: 'Featured hot product 3',
        title: 'Hot Sale 3',
      },
      {
        itemImageSrc: './assets/product-4.jpg',
        alt: 'Featured hot product 4',
        title: 'Hot Sale 4',
      },
    ];

    // ── Sync URL parameters to subjects ──
    const routeSub = this._route.queryParams.subscribe((params) => {
      const keyword = params['keyword'] || '';
      const sort = params['sort'] || '-createdAt';
      const page = Number(params['page']) || 1;
      let limit = Number(params['limit']) || 4;

      if (limit > 10) limit = 10;
      if (limit < 1) limit = 1;

      if (keyword !== this.search$.value) this.search$.next(keyword);
      if (sort !== this.sort$.value) this.sort$.next(sort);
      if (page !== this.page$.value) this.page$.next(page);
      if (limit !== this.limit$.value) this.limit$.next(limit);
    });
    this.subscriptions.add(routeSub);

    // ── Unified API fetch stream ──
    const fetchSub = combineLatest([
      this.search$.pipe(debounceTime(350), distinctUntilChanged()),
      this.sort$.pipe(distinctUntilChanged()),
      this.page$.pipe(distinctUntilChanged()),
      this.limit$.pipe(distinctUntilChanged()),
    ])
      .pipe(
        tap(() => {
          this.loading = true;
          this.error = '';
        }),
        switchMap(([keyword, sort, page, limit]) =>
          this._productsService.getProducts({
            keyword: keyword.trim(),
            sort,
            page,
            limit,
          })
        )
      )
      .subscribe({
        next: (response) => {
          this.productsList = (response.products || []).map((prod: ProductModel) => ({
            ...prod,
            isAddedToCart: this._cart.isAddedToCart(prod) || false,
          }));

          // Read pagination metadata
          if (response.paginationResult) {
            this.totalProducts = response.paginationResult.totalCount || response.results || 0;
          } else {
            this.totalProducts = response.results || 0;
          }
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load products. Please check your connection and try again.';
          this.loading = false;
        },
      });
    this.subscriptions.add(fetchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── URL synchronization navigations ──
  onSearch(keyword: string): void {
    this._updateUrl({ keyword: keyword || null, page: null }); // reset to page 1
  }

  onSortChange(sort: string): void {
    this._updateUrl({ sort: sort === '-createdAt' ? null : sort, page: null });
  }

  onPageChange(event: PaginatorState): void {
    const pageIndex = (event.page ?? 0) + 1;
    const limit = event.rows ?? 4;
    this._updateUrl({ page: pageIndex === 1 ? null : pageIndex.toString(), limit: limit === 4 ? null : limit.toString() });
  }

  onLimitChange(val: number | null | undefined): void {
    let limit = Number(val);
    if (isNaN(limit) || limit < 1) {
      limit = 1;
    } else if (limit > 10) {
      limit = 10;
    }

    const newTotalPages = Math.ceil(this.totalProducts / limit);
    let currentPage = this.page$.value;
    if (currentPage > newTotalPages) {
      currentPage = 1;
    }

    this._updateUrl({
      page: currentPage === 1 ? null : currentPage.toString(),
      limit: limit === 4 ? null : limit.toString()
    });
  }

  // ── Apply Coupon logic per product ──
  applyProductCoupon(productId: string): void {
    const code = this.couponInputs[productId]?.trim();
    if (!code) {
      this.couponStates[productId] = { errorMsg: 'Please enter a coupon code' };
      return;
    }

    this.couponStates[productId] = { loading: true };

    this._productsService.applyProductCoupon(productId, code).subscribe({
      next: (res: any) => {
        this.couponStates[productId] = {
          discountedPrice: res.discountedPrice,
          discountPercent: res.discount,
          loading: false,
        };
      },
      error: (err: any) => {
        this.couponStates[productId] = {
          errorMsg: err.error?.message || 'Coupon is invalid or expired',
          loading: false,
        };
      }
    });
  }

  // ── Remove coupon per product ──
  removeProductCoupon(productId: string): void {
    delete this.couponStates[productId];
    this.couponInputs[productId] = '';
  }

  // ── Cart Action Bridge ──
  addToCart(product: ProductModel): void {
    this._cart.addToCart(product);
  }

  private _updateUrl(changes: Record<string, string | number | null>): void {
    const current = { ...this._route.snapshot.queryParams };

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') {
        delete current[key];
      } else {
        current[key] = value.toString();
      }
    }

    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: current,
      replaceUrl: true,
    });
  }
}
