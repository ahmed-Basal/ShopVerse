import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddressService } from '../../core/service/address.service';
import { AddressModel } from '../../core/models/address/address.model';
import { WishlistService } from '../../core/service/wishlist.service';
import { OrdersService } from '../../core/service/orders.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { ProductModel } from '../../core/models/products/product.model';
import { RawProductModel } from '../../core/models/products/raw-product.model';
import { OrderModel } from '../../core/models/orders/order.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  activeTab: 'favorites' | 'addresses' | 'orders' = 'favorites';
  
  // Favorites wishlists
  wishlistItems: RawProductModel[] = [];
  wishlistLoading = false;

  // Addresses CRUD
  addresses: AddressModel[] = [];
  addressLoading = false;
  showAddressForm = false;
  addressForm!: FormGroup;
  editingAddressId: string | null = null;
  defaultAddressId: string | null = null;

  // Orders History
  orders: OrderModel[] = [];
  ordersLoading = false;

  constructor(
    private _wishlist: WishlistService,
    private _address: AddressService,
    private _orders: OrdersService,
    private _toast: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.switchTab('favorites');
    this.initAddressForm();
    
    // Load local default address ID
    if (typeof window !== 'undefined') {
      this.defaultAddressId = localStorage.getItem('defaultAddressId');
    }
  }

  initAddressForm(): void {
    this.addressForm = new FormGroup({
      alias: new FormControl('', [Validators.required]),
      city: new FormControl('', [Validators.required]),
      details: new FormControl('', [Validators.required]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^01[0125][0-9]{8}$/)
      ]),
      postalCode: new FormControl('')
    });
  }

  switchTab(tab: 'favorites' | 'addresses' | 'orders'): void {
    this.activeTab = tab;
    if (tab === 'favorites') {
      this.loadWishlist();
    } else if (tab === 'addresses') {
      this.loadAddresses();
    } else if (tab === 'orders') {
      this.loadOrders();
    }
  }

  // --- Wishlist Methods ---
  loadWishlist(): void {
    this.wishlistLoading = true;
    this._wishlist.getWishlist().subscribe({
      next: (res) => {
        this.wishlistItems = res.data || [];
        this.wishlistLoading = false;
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to load wishlist.');
        this.wishlistLoading = false;
      }
    });
  }

  removeFromWishlist(productId: string): void {
    this._wishlist.removeFromWishlist(productId).subscribe({
      next: () => {
        this._toast.showSuccess('Success', 'Removed from favorites.');
        this.loadWishlist();
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to remove from wishlist.');
      }
    });
  }

  // --- Address CRUD Methods ---
  loadAddresses(): void {
    this.addressLoading = true;
    this._address.getAddresses().subscribe({
      next: (res) => {
        this.addresses = res.data || [];
        this.addressLoading = false;
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to load addresses.');
        this.addressLoading = false;
      }
    });
  }

  openAddAddress(): void {
    this.editingAddressId = null;
    this.addressForm.reset();
    this.showAddressForm = true;
  }

  openEditAddress(address: AddressModel): void {
    this.editingAddressId = address._id || address.id || null;
    this.addressForm.patchValue({
      alias: address.alias || '',
      city: address.city || '',
      details: address.details || '',
      phone: address.phone || '',
      postalCode: address.postalCode || ''
    });
    this.showAddressForm = true;
  }

  closeAddressForm(): void {
    this.showAddressForm = false;
    this.addressForm.reset();
    this.editingAddressId = null;
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const payload = this.addressForm.value;
    if (this.editingAddressId) {
      // Edit
      this._address.updateAddress(this.editingAddressId, payload).subscribe({
        next: () => {
          this._toast.showSuccess('Success', 'Address updated successfully.');
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to update address.');
        }
      });
    } else {
      // Add
      this._address.addAddress(payload).subscribe({
        next: () => {
          this._toast.showSuccess('Success', 'Address added successfully.');
          this.closeAddressForm();
          this.loadAddresses();
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to add address.');
        }
      });
    }
  }

  removeAddress(addressId: string): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this._address.removeAddress(addressId).subscribe({
        next: () => {
          this._toast.showSuccess('Success', 'Address deleted successfully.');
          if (this.defaultAddressId === addressId) {
            this.defaultAddressId = null;
            localStorage.removeItem('defaultAddressId');
          }
          this.loadAddresses();
        },
        error: (err) => {
          this._toast.showError('Error', err.error?.message || 'Failed to delete address.');
        }
      });
    }
  }

  setDefaultAddress(addressId: string): void {
    this.defaultAddressId = addressId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAddressId', addressId);
    }
    this._toast.showSuccess('Success', 'Default address updated.');
  }

  // --- Orders Methods ---
  loadOrders(): void {
    this.ordersLoading = true;
    this._orders.getOrders().subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.ordersLoading = false;
      },
      error: (err) => {
        this._toast.showError('Error', err.error?.message || 'Failed to load order history.');
        this.ordersLoading = false;
      }
    });
  }
}
