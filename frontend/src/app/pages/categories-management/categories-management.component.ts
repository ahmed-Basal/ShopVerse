import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/service/category.service';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { SubcategoryFormComponent } from '../../shared/subcategory-form/subcategory-form.component';
import { ImageUploaderComponent, ImageUploadEvent } from '../../shared/image-uploader/image-uploader.component';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SubcategoryFormComponent,
    ImageUploaderComponent,
    ImageUrlPipe,
  ],
  templateUrl: './categories-management.component.html',
  styleUrl: './categories-management.component.scss',
})
export class CategoriesManagementComponent implements OnInit {
  categories: CategoryModel[] = [];
  subcategories: SubcategoryModel[] = [];
  categorySubcategoriesMap: { [categoryId: string]: SubcategoryModel[] } = {};

  searchQuery = '';
  viewMode: 'grid' | 'table' = 'grid';

  isEditMode = false;
  currentCategoryId = '';
  categoryImageFile: File | null = null;
  categoryImageUrl: string = '';
  categoryImagePreview: string | null = null;
  loading = false;
  showForm = false;
  categoryForm!: FormGroup;

  // Subcategory management state
  showSubcategoryForm = false;
  selectedSubcategory: SubcategoryModel | null = null;
  selectedParentCategory: CategoryModel | null = null;
  isAdmin = false;

  // Confirmation Delete modal state
  showDeleteModal = false;
  deleteTargetType: 'category' | 'subcategory' = 'category';
  deleteTargetId = '';
  deleteTargetName = '';
  deleteLoading = false;

  constructor(
    private _categoryService: CategoryService,
    private _subcategoryService: SubcategoryService,
    private _authService: AuthService,
    private _notifecationsService: NotifecationsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.isAdmin = this._authService.isAdmin();
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
  }

  loadCategories(): void {
    this.loading = true;
    this._categoryService.getAllCategoriesAdmin().subscribe({
      next: (res) => {
        this.categories = (res.data || []).map((cat: any) => ({
          ...cat,
          id: cat.id || cat._id,
          _id: cat._id || cat.id,
        }));
        this.loadSubcategories();
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load categories');
        this.loading = false;
      },
    });
  }

  loadSubcategories(): void {
    this._subcategoryService.getAllSubcategories(1, 200).subscribe({
      next: (res) => {
        this.subcategories = (res.data || []).map((sub: any) => ({
          ...sub,
          id: sub.id || sub._id,
          _id: sub._id || sub.id,
        }));
        this.mapSubcategories();
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load subcategories');
        this.loading = false;
      },
    });
  }

  mapSubcategories(): void {
    this.categorySubcategoriesMap = {};
    this.categories.forEach((cat) => {
      const primaryKey = cat.id || cat._id;
      this.categorySubcategoriesMap[primaryKey] = [];
      if (cat._id && cat._id !== primaryKey) {
        this.categorySubcategoriesMap[cat._id] = this.categorySubcategoriesMap[primaryKey];
      }
    });

    this.subcategories.forEach((sub) => {
      let catId = '';
      if (typeof sub.category === 'object' && sub.category) {
        catId = sub.category.id || sub.category._id || '';
      } else {
        catId = (sub.category || sub.categoryId || '') as string;
      }

      if (catId) {
        if (!this.categorySubcategoriesMap[catId]) {
          this.categorySubcategoriesMap[catId] = [];
        }
        this.categorySubcategoriesMap[catId].push(sub);
      }
    });
  }

  getSubcategories(cat: CategoryModel): SubcategoryModel[] {
    const id = cat.id || cat._id;
    return this.categorySubcategoriesMap[id] || (cat._id ? this.categorySubcategoriesMap[cat._id] : []) || [];
  }

  get filteredCategories(): CategoryModel[] {
    if (!this.searchQuery.trim()) {
      return this.categories;
    }
    const q = this.searchQuery.toLowerCase().trim();
    return this.categories.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q))
    );
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentCategoryId = '';
    this.categoryImageFile = null;
    this.categoryImageUrl = '';
    this.categoryImagePreview = null;
    this.showForm = true;
    this.initForm();
  }

  openEditForm(cat: CategoryModel): void {
    this.isEditMode = true;
    this.currentCategoryId = (cat.id || cat._id) as string;
    this.categoryImageFile = null;
    this.categoryImageUrl = cat.image || '';
    this.categoryImagePreview = cat.image || null;
    this.showForm = true;

    this.categoryForm.patchValue({
      name: cat.name || '',
    });

    this.loading = true;
    this._categoryService.getCategory(this.currentCategoryId).subscribe({
      next: (res) => {
        if (res.data) {
          this.categoryForm.patchValue({
            name: res.data.name,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.currentCategoryId = '';
    this.categoryImageFile = null;
    this.categoryImageUrl = '';
    this.categoryImagePreview = null;
    this.categoryForm.reset();
  }

  onCategoryImageChange(event: ImageUploadEvent): void {
    if (event.mode === 'file') {
      this.categoryImageFile = event.file;
      this.categoryImageUrl = '';
    } else {
      this.categoryImageUrl = event.url;
      this.categoryImageFile = null;
    }
  }

  submit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('name', this.categoryForm.get('name')?.value);
    if (this.categoryImageFile) {
      formData.append('image', this.categoryImageFile);
    } else if (this.categoryImageUrl) {
      formData.append('image', this.categoryImageUrl);
    }

    if (this.isEditMode) {
      this._categoryService.updateCategory(this.currentCategoryId, formData).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Category updated successfully');
          this.loadCategories();
          this.closeForm();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to update category');
          this.loading = false;
        },
      });
    } else {
      this._categoryService.createCategory(formData).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Category created successfully');
          this.loadCategories();
          this.closeForm();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to create category');
          this.loading = false;
        },
      });
    }
  }

  // Delete Confirmation Dialog handlers
  confirmDeleteCategory(cat: CategoryModel): void {
    this.deleteTargetType = 'category';
    this.deleteTargetId = (cat.id || cat._id) as string;
    this.deleteTargetName = cat.name;
    this.showDeleteModal = true;
  }

  confirmDeleteSubcategory(sub: SubcategoryModel): void {
    this.deleteTargetType = 'subcategory';
    this.deleteTargetId = (sub.id || sub._id) as string;
    this.deleteTargetName = sub.name;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteTargetId = '';
    this.deleteTargetName = '';
    this.deleteLoading = false;
  }

  executeDelete(): void {
    if (!this.deleteTargetId) return;
    this.deleteLoading = true;

    if (this.deleteTargetType === 'category') {
      this._categoryService.deleteCategory(this.deleteTargetId).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Deleted', `Category "${this.deleteTargetName}" was deleted.`);
          this.closeDeleteModal();
          this.loadCategories();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete category');
          this.deleteLoading = false;
        },
      });
    } else {
      this._subcategoryService.deleteSubcategory(this.deleteTargetId).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Deleted', `Subcategory "${this.deleteTargetName}" was deleted.`);
          this.closeDeleteModal();
          this.loadCategories();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete subcategory');
          this.deleteLoading = false;
        },
      });
    }
  }

  // Subcategory management actions
  openAddSubcategory(): void {
    this.selectedSubcategory = null;
    this.selectedParentCategory = null;
    this.showSubcategoryForm = true;
  }

  openAddSubcategoryForCategory(cat: CategoryModel): void {
    this.selectedSubcategory = null;
    this.selectedParentCategory = cat;
    this.showSubcategoryForm = true;
  }

  openEditSubcategory(sub: SubcategoryModel): void {
    this.selectedSubcategory = sub;
    this.selectedParentCategory = null;
    this.showSubcategoryForm = true;
  }

  closeSubcategoryForm(): void {
    this.showSubcategoryForm = false;
    this.selectedSubcategory = null;
    this.selectedParentCategory = null;
  }

  onSubcategorySaved(): void {
    this.closeSubcategoryForm();
    this.loadCategories();
  }
}
