import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MockProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  image: string;
  isEligibleForDiscount: boolean;
  discountedPrice?: number;
  discountApplied?: number;
}

@Component({
  selector: 'app-demo-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demo-products.component.html',
  styleUrl: './demo-products.component.scss',
})
export class DemoProductsComponent implements OnInit {
  // Input binders
  searchQuery: string = '';
  sortOption: 'none' | 'low-to-high' | 'high-to-low' = 'none';
  couponCode: string = '';

  // Coupon state
  couponApplied: boolean = false;
  couponSuccessMsg: string = '';
  couponErrorMsg: string = '';
  activeDiscountPercentage: number = 0;

  // Mock Products list
  products: MockProduct[] = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      price: 1199,
      description: 'Experience titanium build quality, the innovative Action Button, and the power of the A17 Pro chip for outstanding efficiency.',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=600',
      isEligibleForDiscount: true,
    },
    {
      id: 2,
      title: 'Sony WH-1000XM5',
      price: 399,
      description: 'Industry-leading noise canceling headphones with newly developed drivers, offering unparalleled sound quality and smart listening features.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
      isEligibleForDiscount: false, // NOT eligible
    },
    {
      id: 3,
      title: 'iPad Pro 12.9" (M2)',
      price: 1099,
      description: 'Astonishing Liquid Retina XDR display, blazing-fast M2 chip, advanced camera systems, and lightning-fast wireless connectivity.',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600',
      isEligibleForDiscount: true,
    },
    {
      id: 4,
      title: 'Keychron Q3 Keyboard',
      price: 199,
      description: 'A fully customizable mechanical keyboard with QMK/VIA support, a full CNC aluminum body, double-gasket design, and hot-swappable switches.',
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600',
      isEligibleForDiscount: true,
    },
    {
      id: 5,
      title: 'Logitech MX Master 3S Mouse',
      price: 99,
      description: 'Master ergonomics with a smart shift scroll wheel, silent click switches, and an 8000 DPI sensor capable of tracking on any surface.',
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600',
      isEligibleForDiscount: false, // NOT eligible
    },
    {
      id: 6,
      title: 'Dell UltraSharp 32" 4K Monitor',
      price: 849,
      description: 'Bring detail to life with 4K resolution, outstanding IPS Black panel technology, and 90W USB-C connectivity to simplify your workspace.',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600',
      isEligibleForDiscount: false, // NOT eligible
    },
  ];

  ngOnInit(): void {}

  // ── Getter for search and sort operations (local mock data only) ──
  get filteredProducts(): MockProduct[] {
    // 1. Filter by keyword/name
    let result = this.products.filter((prod) =>
      prod.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    // 2. Sort by price selection
    if (this.sortOption === 'low-to-high') {
      result = [...result].sort((a, b) => {
        const pA = a.discountedPrice !== undefined ? a.discountedPrice : a.price;
        const pB = b.discountedPrice !== undefined ? b.discountedPrice : b.price;
        return pA - pB;
      });
    } else if (this.sortOption === 'high-to-low') {
      result = [...result].sort((a, b) => {
        const pA = a.discountedPrice !== undefined ? a.discountedPrice : a.price;
        const pB = b.discountedPrice !== undefined ? b.discountedPrice : b.price;
        return pB - pA;
      });
    }

    return result;
  }

  // ── Apply Coupon logic (Simulated percentage discount) ──
  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    this.couponErrorMsg = '';
    this.couponSuccessMsg = '';

    // Simulate validation
    let discount = 0;
    if (code === 'SAVE20') {
      discount = 20;
    } else if (code === 'SAVE50') {
      discount = 50;
    } else if (code === 'SAVE10') {
      discount = 10;
    } else {
      this.couponErrorMsg = 'Invalid coupon code! Try using "SAVE20" or "SAVE50".';
      this.activeDiscountPercentage = 0;
      this.couponApplied = false;
      this.resetAllDiscounts();
      return;
    }

    this.couponApplied = true;
    this.activeDiscountPercentage = discount;
    this.couponSuccessMsg = `Promo code "${code}" applied successfully! ${discount}% discount applied to eligible products.`;

    // Apply discount only to products with 'isEligibleForDiscount = true'
    this.products = this.products.map((prod) => {
      if (prod.isEligibleForDiscount) {
        const discounted = prod.price - (prod.price * discount) / 100;
        return {
          ...prod,
          discountedPrice: Number(discounted.toFixed(2)),
          discountApplied: discount,
        };
      }
      return prod;
    });
  }

  // ── Remove active coupon and reset pricing ──
  removeCoupon(): void {
    this.couponApplied = false;
    this.couponCode = '';
    this.couponSuccessMsg = '';
    this.couponErrorMsg = '';
    this.activeDiscountPercentage = 0;
    this.resetAllDiscounts();
  }

  private resetAllDiscounts(): void {
    this.products = this.products.map((prod) => {
      const updated = { ...prod };
      delete updated.discountedPrice;
      delete updated.discountApplied;
      return updated;
    });
  }
}
