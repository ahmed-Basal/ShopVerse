import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/service/category.service';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { AuthService } from '../../core/service/auth.service';
import { NotifecationsService } from '../../core/service/notifecations.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { SubcategoryFormComponent } from '../../shared/subcategory-form/subcategory-form.component';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SubcategoryFormComponent],
  templateUrl: './categories-management.component.html',
  styleUrl: './categories-management.component.scss',
})
export class CategoriesManagementComponent implements OnInit {
  categories: CategoryModel[] = [];
  subcategories: SubcategoryModel[] = [];
  categorySubcategoriesMap: { [categoryId: string]: SubcategoryModel[] } = {};
  expandedCategories: { [categoryId: string]: boolean } = {};

  isEditMode = false;
  currentCategoryId = '';
  categoryImageFile: File | null = null;
  categoryImagePreview: string | null = null;
  loading = false;
  showForm = false;
  categoryForm!: FormGroup;

  // Subcategory management state
  showSubcategoryForm = false;
  selectedSubcategory: SubcategoryModel | null = null;
  selectedParentCategory: CategoryModel | null = null;
  isAdmin = false;

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
        this.categories = res.data;
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
        this.subcategories = res.data;
        this.mapSubcategories();
        this.loading = false;
      },
      error: () => {
        this._notifecationsService.showError('Error', 'Failed to load subcategories');
        this.loading = false;
      }
    });
  }

  mapSubcategories(): void {
    this.categorySubcategoriesMap = {};
    this.categories.forEach(cat => {
      this.categorySubcategoriesMap[cat._id] = [];
    });
    this.subcategories.forEach(sub => {
      const catId = typeof sub.category === 'object' ? sub.category._id : sub.category;
      if (this.categorySubcategoriesMap[catId]) {
        this.categorySubcategoriesMap[catId].push(sub);
      } else {
        this.categorySubcategoriesMap[catId] = [sub];
      }
    });
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategories[categoryId] = !this.expandedCategories[categoryId];
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentCategoryId = '';
    this.categoryImageFile = null;
    this.categoryImagePreview = null;
    this.showForm = true;
    this.initForm();
  }

  openEditForm(cat: CategoryModel): void {
    this.isEditMode = true;
    this.currentCategoryId = cat._id;
    this.categoryImageFile = null;
    this.categoryImagePreview = cat.image || null;
    this.showForm = true;
    this.loading = true;

    this._categoryService.getCategory(cat._id).subscribe({
      next: (res) => {
        this.categoryForm.patchValue({
          name: res.data.name,
        });
        this.loading = false;
      },
      error: (err) => {
        this._notifecationsService.showError('Error', 'Failed to load category details');
        this.loading = false;
        this.closeForm();
      },
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.currentCategoryId = '';
    this.categoryImageFile = null;
    this.categoryImagePreview = null;
    this.categoryForm.reset();
  }

  onCategoryImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.categoryImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.categoryImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
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

  deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category? All products and subcategories belonging to it may be affected.')) {
      this.loading = true;
      this._categoryService.deleteCategory(id).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Category deleted successfully');
          this.loadCategories();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete category');
          this.loading = false;
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

  deleteSubcategory(id: string): void {
    if (confirm('Are you sure you want to delete this subcategory?')) {
      this.loading = true;
      this._subcategoryService.deleteSubcategory(id).subscribe({
        next: () => {
          this._notifecationsService.showSuccess('Success', 'Subcategory deleted successfully');
          this.loadCategories();
        },
        error: (err) => {
          this._notifecationsService.showError('Error', err.error?.message || 'Failed to delete subcategory');
          this.loading = false;
        }
      });
    }
  }
}
