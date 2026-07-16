import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { baseUrl } from '../../core/apiRoot/baseUrl';

@Component({
  selector: 'app-coupons-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coupons-management.component.html',
  styleUrl: './coupons-management.component.scss'
})
export class CouponsManagementComponent implements OnInit {
  coupons: any[] = [];
  loading = false;
  showForm = false;
  couponForm!: FormGroup;
  todayString = new Date().toISOString().split('T')[0];

  constructor(
    private _http: HttpClient,
    private _toast: NotifecationsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCoupons();
  }

  initForm(): void {
    this.couponForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      expire: new FormControl('', [Validators.required]),
      discount: new FormControl('', [Validators.required, Validators.min(1), Validators.max(100)])
    });
  }

  loadCoupons(): void {
    this.loading = true;
    this._http.get(`${baseUrl}/api/v1/coupons`).subscribe({
      next: (res: any) => {
        this.coupons = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to load coupons');
        this.loading = false;
      }
    });
  }

  openAddForm(): void {
    this.couponForm.reset();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.couponForm.reset();
  }

  submit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.couponForm.value;

    this._http.post(`${baseUrl}/api/v1/coupons`, payload).subscribe({
      next: () => {
        this._toast.showSuccess('Success', 'Coupon created successfully');
        this.loadCoupons();
        this.closeForm();
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to create coupon');
        this.loading = false;
      }
    });
  }

  deleteCoupon(id: string): void {
    if (confirm('Are you sure you want to delete this coupon?')) {
      this.loading = true;
      this._http.delete(`${baseUrl}/api/v1/coupons/${id}`).subscribe({
        next: () => {
          this._toast.showSuccess('Success', 'Coupon deleted successfully');
          this.loadCoupons();
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to delete coupon');
          this.loading = false;
        }
      });
    }
  }
}
