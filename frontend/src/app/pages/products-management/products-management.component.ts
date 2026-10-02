import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/service/category.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { ProductsService } from '../../core/service/products.service';
import { ImageUploaderComponent, ImageUploadEvent } from '../../shared/image-uploader/image-uploader.component';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ImageUploaderComponent, ImageUrlPipe],
  templateUrl: './products-management.component.html',
  styleUrl: './products-management.component.scss',
})
export class ProductsManagementComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  loading = false;

  showForm = false;
  isEditMode = false;
  currentProductId = '';

  productForm!: FormGroup;

  // Cover image handling
  coverImageFile: File | null = null;
  coverImageUrl: string = '';

  // Gallery images handling
  galleryFiles: File[] = [];
  galleryUrls: string[] = [];
  galleryUrlInput: string = '';

  constructor(
    private _productsService: ProductsService,
    private _categoryService: CategoryService,
    private _notifecationsService: NotifecationsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  initForm(): void {
    this.productForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl('', [Validators.required, Validators.minLength(10)]),
      price: new FormControl('', [Validators.required, Validators.min(1)]),
      quantity: new FormControl('', [Validators.required, Validators.min(1)]),
      category: new FormControl('', [Validators.required]),
      priceAfterDiscount: new FormControl(null, [Validators.min(0)]),
      colors: new FormControl(''),
    });
  }

  loadProducts(): void {
    this.loading = true;
    this._productsService.getAllProductsAdmin(1, 100).subscribe({
      next: (res) => {
        this.products = res.data;
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load products');
        this.loading = false;
      },
    });
  }

  loadCategories(): void {
    this._categoryService.getAllCategoriesAdmin().subscribe({
      next: (res) => {
        this.categories = res.data;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load categories');
      },
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentProductId = '';
    this.showForm = true;
    this.initForm();
    this.coverImageFile = null;
    this.coverImageUrl = '';
    this.galleryFiles = [];
    this.galleryUrls = [];
    this.galleryUrlInput = '';
  }

  openEditForm(product: any): void {
    this.isEditMode = true;
    this.currentProductId = product._id;
    this.showForm = true;
    this.coverImageFile = null;
    this.coverImageUrl = '';
    this.galleryFiles = [];
    this.galleryUrls = [];
    this.galleryUrlInput = '';
    this.loading = true;

    this._productsService.getDetails(product._id).subscribe({
      next: (res) => {
        const fetchedProd = res.data;
        const categoryId =
          fetchedProd.category && typeof fetchedProd.category === 'object'
            ? (fetchedProd.category as any)._id
            : fetchedProd.category || '';
        const colorsStr = fetchedProd.colors ? fetchedProd.colors.join(', ') : '';

        this.productForm.patchValue({
          title: fetchedProd.title,
          description: fetchedProd.description,
          price: fetchedProd.price,
          quantity: fetchedProd.quantity,
          category: categoryId,
          priceAfterDiscount: fetchedProd.priceAfterDiscount || null,
          colors: colorsStr,
        });

        this.coverImageUrl = fetchedProd.imageCover || '';
        this.galleryUrls = Array.isArray(fetchedProd.images) ? [...fetchedProd.images] : [];
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load product details');
        this.loading = false;
        this.closeForm();
      },
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.productForm.reset();
    this.coverImageFile = null;
    this.coverImageUrl = '';
    this.galleryFiles = [];
    this.galleryUrls = [];
    this.galleryUrlInput = '';
    this.isEditMode = false;
    this.currentProductId = '';
  }

  onCoverImageChange(event: ImageUploadEvent): void {
    if (event.mode === 'file') {
      this.coverImageFile = event.file;
      this.coverImageUrl = '';
    } else {
      this.coverImageUrl = event.url;
      this.coverImageFile = null;
    }
  }

  onGalleryFilesChange(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          this.galleryFiles.push(files[i]);
        }
      }
    }
  }

  removeGalleryFile(index: number): void {
    this.galleryFiles.splice(index, 1);
  }

  addGalleryUrl(): void {
    const trimmed = this.galleryUrlInput.trim();
    if (!trimmed) return;
    this.galleryUrls.push(trimmed);
    this.galleryUrlInput = '';
  }

  removeGalleryUrl(index: number): void {
    this.galleryUrls.splice(index, 1);
  }

  submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const price = this.productForm.get('price')?.value;
    const priceAfterDiscount = this.productForm.get('priceAfterDiscount')?.value;
    if (priceAfterDiscount && Number(priceAfterDiscount) >= Number(price)) {
      this._notifecationsService.showError('Validation Error', 'Discounted price must be less than original price');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.productForm.get('title')?.value);
    formData.append('description', this.productForm.get('description')?.value);
    formData.append('price', price);
    formData.append('quantity', this.productForm.get('quantity')?.value);
    formData.append('category', this.productForm.get('category')?.value);

    if (priceAfterDiscount !== null && priceAfterDiscount !== undefined && priceAfterDiscount !== '') {
      formData.append('priceAfterDiscount', priceAfterDiscount);
    }

    const colorsStr = this.productForm.get('colors')?.value || '';
    const colorsArr = colorsStr
      .split(',')
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 0);

    colorsArr.forEach((color: string) => {
      formData.append('colors', color);
    });

    // Cover Image: either file or direct URL
    if (this.coverImageFile) {
      formData.append('imageCover', this.coverImageFile);
    } else if (this.coverImageUrl) {
      formData.append('imageCover', this.coverImageUrl);
    } else if (!this.isEditMode) {
      this._notifecationsService.showError('Image Required', 'Please provide a cover image by uploading a file or entering a URL.');
      return;
    }

    // Gallery files
    if (this.galleryFiles.length > 0) {
      this.galleryFiles.forEach((file: File) => {
        formData.append('images', file);
      });
    }

    // Gallery URLs
    if (this.galleryUrls.length > 0) {
      this.galleryUrls.forEach((url: string) => {
        formData.append('images', url);
      });
    }

    this.loading = true;

    if (this.isEditMode) {
      this._productsService.updateProduct(this.currentProductId, formData).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Product updated successfully');
          this.loadProducts();
          this.closeForm();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to update product');
          this.loading = false;
        },
      });
    } else {
      this._productsService.createProduct(formData).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Product created successfully');
          this.loadProducts();
          this.closeForm();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to create product');
          this.loading = false;
        },
      });
    }
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.loading = true;
      this._productsService.deleteProduct(id).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Product deleted successfully');
          this.loadProducts();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete product');
          this.loading = false;
        },
      });
    }
  }
}