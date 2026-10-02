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
import { BrandService } from '../../core/service/brand.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { BrandModel } from '../../core/models/brand/brand.model';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

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
    PaginatorModule,
    ImageUrlPipe,
  ],
  templateUrl: './home.component.html',
  styleUrls: [],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Galleria images
  images: any[] = [];

  // Products state
  productsList: ProductModel[] = [];
  totalProducts = 0;
  loading = false;
  error = '';

  // Brands strip
  brandsList: BrandModel[] = [];

  // Wishlist set of product IDs
  wishlistIds: Set<string> = new Set();

  // RxJS subjects for unified data flow
  search$ = new BehaviorSubject<string>('');
  sort$ = new BehaviorSubject<string>('-createdAt');
  page$ = new BehaviorSubject<number>(1);
  limit$ = new BehaviorSubject<number>(8); // default 8 for 4-col grid

  // Coupon inputs and active state per product
  couponInputs: { [productId: string]: string } = {};
  couponStates: { [productId: string]: CouponState } = {};

  private subscriptions = new Subscription();

  sortOptions = [
    { label: 'Newest Arrivals', value: '-createdAt' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Price: High to Low', value: '-price' },
    { label: 'Top Rated', value: '-ratingsAverage' },
    { label: 'Most Popular', value: 'popular' }
  ];

  constructor(
    private _productsService: ProductsService,
    private _cart: CartService,
    private _brandService: BrandService,
    private _wishlistService: WishlistService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.images = [
      {
        itemImageSrc: '/assets/product-1.jpg',
        alt: 'Featured hot product 1',
        title: 'Premium Sound & Audio Gear',
      },
      {
        itemImageSrc: '/assets/product-2.jpg',
        alt: 'Featured hot product 2',
        title: 'Smart Wearables & Tech',
      },
      {
        itemImageSrc: '/assets/product-3.jpg',
        alt: 'Featured hot product 3',
        title: 'Modern Style & Apparel',
      },
      {
        itemImageSrc: '/assets/product-4.jpg',
        alt: 'Featured hot product 4',
        title: 'Exclusive Deals Everyday',
      },
    ];

    // Load brands for strip
    this._brandService.getAllBrands(1, 12).subscribe({
      next: (res) => {
        this.brandsList = res.data || [];
      },
      error: () => {}
    });

    // Load wishlist IDs if logged in
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

    // Sync URL parameters to subjects
    const routeSub = this._route.queryParams.subscribe((params) => {
      const keyword = params['keyword'] || '';
      const sort = params['sort'] || '-createdAt';
      const page = Number(params['page']) || 1;
      let limit = Number(params['limit']) || 8;

      if (limit > 24) limit = 24;
      if (limit < 1) limit = 1;

      if (keyword !== this.search$.value) this.search$.next(keyword);
      if (sort !== this.sort$.value) this.sort$.next(sort);
      if (page !== this.page$.value) this.page$.next(page);
      if (limit !== this.limit$.value) this.limit$.next(limit);
    });
    this.subscriptions.add(routeSub);

    // Unified API fetch stream
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

          if (this.productsList.length > 0) {
            this.images = this.productsList.slice(0, 4).map((p) => ({
              itemImageSrc: p.imageCover || '/assets/product-1.jpg',
              alt: p.title,
              title: p.title,
            }));
          }

          if (response.paginationResult) {
            this.totalProducts = response.paginationResult.totalCount || response.results || 0;
          } else {
            this.totalProducts = response.results || 0;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('API ERROR:', err);
          this.error = 'Failed to load products. Please check your connection and try again.';
          this.loading = false;
        },
      });
    this.subscriptions.add(fetchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearch(keyword: string): void {
    this._updateUrl({ keyword: keyword || null, page: null });
  }

  onSortChange(sort: string): void {
    this._updateUrl({ sort: sort === '-createdAt' ? null : sort, page: null });
  }

  onPageChange(event: PaginatorState): void {
    const pageIndex = (event.page ?? 0) + 1;
    const limit = event.rows ?? 8;
    this._updateUrl({ page: pageIndex === 1 ? null : pageIndex.toString(), limit: limit === 8 ? null : limit.toString() });
  }

  toggleWishlist(product: ProductModel, event: Event): void {
    event.stopPropagation();
    const id = product.id;
    if (this.wishlistIds.has(id)) {
      this._wishlistService.removeFromWishlist(id).subscribe({
        next: () => this.wishlistIds.delete(id),
      });
    } else {
      this._wishlistService.addToWishlist(id).subscribe({
        next: () => this.wishlistIds.add(id),
      });
    }
  }

  isInWishlist(id: string): boolean {
    return this.wishlistIds.has(id);
  }

  applyProductCoupon(productId: string): void {
    const code = this.couponInputs[productId]?.trim();
    if (!code) {
      this.couponStates[productId] = { errorMsg: 'Enter code' };
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
          errorMsg: err.error?.message || 'Invalid coupon',
          loading: false,
        };
      }
    });
  }

  removeProductCoupon(productId: string): void {
    delete this.couponStates[productId];
    this.couponInputs[productId] = '';
  }

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