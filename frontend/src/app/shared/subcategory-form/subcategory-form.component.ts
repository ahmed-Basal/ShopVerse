import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { CategoryService } from '../../core/service/category.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { ImageUploaderComponent, ImageUploadEvent } from '../image-uploader/image-uploader.component';

@Component({
  selector: 'app-subcategory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploaderComponent],
  templateUrl: './subcategory-form.component.html',
  styleUrl: './subcategory-form.component.scss'
})
export class SubcategoryFormComponent implements OnInit {
  @Input() subcategory: SubcategoryModel | null = null;
  @Input() category: CategoryModel | null = null;
  @Input() categories: CategoryModel[] = [];
  @Input() isCategory = false;
  @Output() saved = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  imageUrl: string = '';
  imagePreview: string | null = null;

  constructor(
    private _subcategoryService: SubcategoryService,
    private _categoryService: CategoryService,
    private _notifecationsService: NotifecationsService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    if (this.isCategory) {
      this.form = new FormGroup({
        name: new FormControl(this.category?.name || '', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(32)
        ])
      });

      if (this.category?.image) {
        this.imagePreview = this.category.image;
      }
    } else {
      const parentCategory = this.category
        ? (this.category._id || this.category.id || '')
        : (this.subcategory 
          ? (typeof this.subcategory.category === 'object' 
              ? (this.subcategory.category._id || this.subcategory.category.id || '') 
              : (this.subcategory.category || (this.subcategory as any).categoryId || ''))
          : '');

      this.form = new FormGroup({
        name: new FormControl(this.subcategory?.name || '', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(32)
        ]),
        category: new FormControl(parentCategory, [Validators.required]),
        description: new FormControl(this.subcategory?.description || '')
      });

      if (this.subcategory?.image) {
        this.imagePreview = this.subcategory.image;
      }
    }
  }

  onImageChange(event: ImageUploadEvent): void {
    if (event.mode === 'file') {
      this.selectedFile = event.file;
      this.imageUrl = '';
    } else {
      this.imageUrl = event.url;
      this.selectedFile = null;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('name', this.form.get('name')?.value);

    if (this.isCategory) {
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      } else if (this.imageUrl) {
        formData.append('image', this.imageUrl);
      }

      const categoryId = (this.category?._id || this.category?.id || '') as string;
      const request$ = this.category
        ? this._categoryService.updateCategory(categoryId, formData)
        : this._categoryService.createCategory(formData);

      request$.subscribe({
        next: () => {
          this._notifecationsService.showSuccess(
            'Success',
            this.category ? 'Category updated successfully' : 'Category created successfully'
          );
          this.saved.emit();
          this.loading = false;
        },
        error: (err) => {
          this._notifecationsService.showError(
            'Error',
            err.error?.message || 'Failed to save category'
          );
          this.loading = false;
        }
      });
    } else {
      formData.append('category', this.form.get('category')?.value);
      formData.append('description', this.form.get('description')?.value || '');
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      } else if (this.imageUrl) {
        formData.append('image', this.imageUrl);
      }

      const subcategoryId = (this.subcategory?._id || this.subcategory?.id || '') as string;
      const request$ = this.subcategory
        ? this._subcategoryService.updateSubcategory(subcategoryId, formData)
        : this._subcategoryService.createSubcategory(formData);

      request$.subscribe({
        next: () => {
          this._notifecationsService.showSuccess(
            'Success',
            this.subcategory ? 'Subcategory updated successfully' : 'Subcategory created successfully'
          );
          this.saved.emit();
          this.loading = false;
        },
        error: (err) => {
          this._notifecationsService.showError(
            'Error',
            err.error?.message || 'Failed to save subcategory'
          );
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.close.emit();
  }
}
