import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ProductModel } from '../../core/models/products/product.model';
import { CartService } from '../../core/service/cart.service';
import { ReviewsService } from '../../core/service/reviews.service';
import { AuthService } from '../../core/service/auth.service';
import { ReviewModel } from '../../core/models/reviews/review.model';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { WishlistService } from '../../core/service/wishlist.service';
import { ProductsService } from '../../core/service/products.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [ButtonModule, RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent implements OnInit {
  id: string = '';
  productDetails!: ProductModel;
  isAddedToCart: boolean = false;
  isLoggedIn: boolean = false;
  isInWishlist: boolean = false;

  // Reviews list and pagination
  reviewsList: ReviewModel[] = [];
  reviewsPage = 1;
  reviewsLimit = 5;
  hasMoreReviews = true;
  reviewsLoading = false;

  // Review Form
  reviewForm!: FormGroup;
  submittingReview = false;

  // Coupon fields
  couponCode = '';
  couponLoading = false;
  couponError = '';
  appliedCoupon: any = null;

  constructor(
    private _activateRoute: ActivatedRoute,
    private _cartService: CartService,
    private _reviews: ReviewsService,
    private _auth: AuthService,
    private _toast: NotifecationsService,
    private _wishlist: WishlistService,
    private _productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this._activateRoute.paramMap.subscribe((next: any) => {
      this.id = next.params['id'];
      this.reviewsPage = 1;
      this.reviewsList = [];
      this.displayDetails();
      this.loadProductReviews();
      this.checkWishlistState();
    });

    this.isLoggedIn = this._auth.authorized();
    this.initReviewForm();
  }

  checkWishlistState(): void {
    if (this._auth.authorized() && this.id) {
      this._wishlist.getWishlist().subscribe({
        next: (res) => {
          const items = res.data || [];
          this.isInWishlist = items.some((item: any) => (item._id || item.id) === this.id);
        },
        error: (err) => {
          console.warn('Failed to load details wishlist state:', err);
        }
      });
    }
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    if (!this._auth.authorized()) {
      this._toast.showError('Authentication Required', 'Please log in to add items to your favorites.');
      return;
    }

    if (!this.id) return;

    if (this.isInWishlist) {
      this._wishlist.removeFromWishlist(this.id).subscribe({
        next: () => {
          this.isInWishlist = false;
          this._toast.showSuccess('Success', 'Removed from favorites.');
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to remove from wishlist.');
        }
      });
    } else {
      this._wishlist.addToWishlist(this.id).subscribe({
        next: () => {
          this.isInWishlist = true;
          this._toast.showSuccess('Success', 'Added to favorites.');
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to add to wishlist.');
        }
      });
    }
  }

  initReviewForm(): void {
    this.reviewForm = new FormGroup({
      ratings: new FormControl(5, [Validators.required, Validators.min(1), Validators.max(5)]),
      title: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  displayDetails(): void {
    this._activateRoute.data.subscribe((data: any) => {
      this.productDetails = {
        ...data.details.product,
        isAddedToCart: this._cartService.isAddedToCart(data.details.product),
      };
    });
  }

  loadProductReviews(append = false): void {
    this.reviewsLoading = true;
    this._reviews.getProductReviews(this.id, this.reviewsPage, this.reviewsLimit).subscribe({
      next: (res) => {
        const fetched = res.data || [];
        if (append) {
          this.reviewsList = [...this.reviewsList, ...fetched];
        } else {
          this.reviewsList = fetched;
        }
        
        // If fetched count is less than limit, no more reviews
        this.hasMoreReviews = fetched.length === this.reviewsLimit;
        this.reviewsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
        this.reviewsLoading = false;
      }
    });
  }

  loadMoreReviews(): void {
    if (this.reviewsLoading || !this.hasMoreReviews) return;
    this.reviewsPage++;
    this.loadProductReviews(true);
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.submittingReview = true;
    const payload = {
      title: this.reviewForm.value.title,
      ratings: Number(this.reviewForm.value.ratings),
      product: this.id
    };

    this._reviews.createReview(payload).subscribe({
      next: () => {
        this._toast.showSuccess('Success', 'Your review has been posted successfully.');
        this.reviewForm.reset({ ratings: 5, title: '' });
        this.reviewsPage = 1;
        this.loadProductReviews(false);
        this.submittingReview = false;
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to post review. You might have already reviewed this product.');
        this.submittingReview = false;
      }
    });
  }

  addToCart(product: ProductModel) {
    this._cartService.addToCart(product);
  }

  applyCoupon(): void {
    if (!this._auth.authorized()) {
      this._toast.showError('Authentication Required', 'Please log in to apply coupons.');
      return;
    }

    const code = this.couponCode.trim();
    if (!code) {
      this.couponError = 'Please enter a coupon code.';
      return;
    }

    this.couponLoading = true;
    this.couponError = '';
    this.appliedCoupon = null;

    this._productsService.applyProductCoupon(this.id, code).subscribe({
      next: (res) => {
        this.couponLoading = false;
        if (res.status === 'success') {
          this.appliedCoupon = res;
          this._toast.showSuccess('Success', `Coupon applied! You save ${res.discount}%.`);
        } else {
          this.couponError = 'Failed to apply coupon.';
        }
      },
      error: (err) => {
        this.couponLoading = false;
        this.couponError = err.error?.message || 'Invalid or expired coupon.';
        this._toast.showError('Error', this.couponError);
      }
    });
  }
}
