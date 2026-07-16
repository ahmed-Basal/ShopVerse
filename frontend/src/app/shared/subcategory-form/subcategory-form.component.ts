import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { CategoryService } from '../../core/service/category.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';

@Component({
  selector: 'app-subcategory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
        ? this.category._id
        : (this.subcategory 
          ? (typeof this.subcategory.category === 'object' ? this.subcategory.category._id : this.subcategory.category)
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
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
      }

      const request$ = this.category
        ? this._categoryService.updateCategory(this.category._id, formData)
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
      }

      const request$ = this.subcategory
        ? this._subcategoryService.updateSubcategory(this.subcategory._id, formData)
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
