import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BrandModel } from '../../core/models/brand/brand.model';
import { BrandService } from '../../core/service/brand.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './brands.component.html',
  styleUrls: [],
})
export class BrandsComponent implements OnInit {
  brands: BrandModel[] = [];
  filteredBrands: BrandModel[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string = '';

  constructor(private _brandService: BrandService) {}

  ngOnInit(): void {
    this.fetchBrands();
  }

  fetchBrands(): void {
    this.loading = true;
    this.error = '';
    this._brandService.getAllBrands(1, 100).subscribe({
      next: (res) => {
        this.brands = res.data || [];
        this.filteredBrands = this.brands;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching brands:', err);
        this.error = 'Failed to load brands. Please try again.';
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredBrands = this.brands;
    } else {
      this.filteredBrands = this.brands.filter((b) =>
        b.name.toLowerCase().includes(term)
      );
    }
  }
}
