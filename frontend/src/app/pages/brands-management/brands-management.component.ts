import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { BrandModel } from '../../core/models/brand/brand.model';
import { BrandService } from '../../core/service/brand.service';
import { NotifecationsService } from '../../core/service/notifecations.service';

@Component({
  selector: 'app-brands-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './brands-management.component.html',
  styleUrls: [],
})
export class BrandsManagementComponent implements OnInit {
  brands: BrandModel[] = [];
  filteredBrands: BrandModel[] = [];
  loading = false;
  showModal = false;
  isEditMode = false;
  currentBrandId = '';
  searchTerm = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  brandForm!: FormGroup;

  constructor(
    private _brandService: BrandService,
    private _toast: NotifecationsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  initForm(): void {
    this.brandForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    });
  }

  loadBrands(): void {
    this.loading = true;
    this._brandService.getAllBrands(1, 100).subscribe({
      next: (res) => {
        this.brands = res.data || [];
        this.filteredBrands = this.brands;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
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

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  openCreate(): void {
    this.isEditMode = false;
    this.currentBrandId = '';
    this.selectedFile = null;
    this.imagePreview = null;
    this.brandForm.reset({ name: '' });
    this.showModal = true;
  }

  openEdit(brand: BrandModel): void {
    this.isEditMode = true;
    this.currentBrandId = brand._id;
    this.selectedFile = null;
    this.imagePreview = brand.image || null;
    this.brandForm.patchValue({ name: brand.name });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedFile = null;
    this.imagePreview = null;
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return;

    const { name } = this.brandForm.value;
    const formData = new FormData();
    formData.append('name', name);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    if (this.isEditMode) {
      this._brandService.updateBrand(this.currentBrandId, formData).subscribe({
        next: () => {
          this._toast.showSuccess('Brand updated successfully');
          this.closeModal();
          this.loadBrands();
        },
        error: () => this._toast.showError('Failed to update brand')
      });
    } else {
      this._brandService.createBrand(formData).subscribe({
        next: () => {
          this._toast.showSuccess('Brand created successfully');
          this.closeModal();
          this.loadBrands();
        },
        error: () => this._toast.showError('Failed to create brand')
      });
    }
  }

  deleteBrand(id: string): void {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    this._brandService.deleteBrand(id).subscribe({
      next: () => {
        this._toast.showSuccess('Brand deleted');
        this.loadBrands();
      },
      error: () => this._toast.showError('Failed to delete brand')
    });
  }
}
