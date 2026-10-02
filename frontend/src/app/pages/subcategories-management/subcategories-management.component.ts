import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { CategoryService } from '../../core/service/category.service';
import { NotifecationsService } from '../../core/service/notifecations.service';

@Component({
  selector: 'app-subcategories-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './subcategories-management.component.html',
  styleUrls: [],
})
export class SubcategoriesManagementComponent implements OnInit {
  subcategories: SubcategoryModel[] = [];
  filteredSubcategories: SubcategoryModel[] = [];
  categories: CategoryModel[] = [];
  loading = false;
  showModal = false;
  isEditMode = false;
  currentSubId = '';
  searchTerm = '';

  subForm!: FormGroup;

  constructor(
    private _subService: SubcategoryService,
    private _catService: CategoryService,
    private _toast: NotifecationsService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  initForm(): void {
    this.subForm = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(2)]),
      category: new FormControl('', [Validators.required]),
    });
  }

  loadData(): void {
    this.loading = true;
    this._catService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data || [];
      }
    });

    this._subService.getAllSubcategories(1, 100).subscribe({
      next: (res) => {
        this.subcategories = res.data || [];
        this.filteredSubcategories = this.subcategories;
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
      this.filteredSubcategories = this.subcategories;
    } else {
      this.filteredSubcategories = this.subcategories.filter((s) =>
        s.name.toLowerCase().includes(term) ||
        (typeof s.category === 'object' && s.category?.name?.toLowerCase().includes(term))
      );
    }
  }

  openCreate(): void {
    this.isEditMode = false;
    this.currentSubId = '';
    this.subForm.reset({
      name: '',
      category: this.categories[0]?._id || '',
    });
    this.showModal = true;
  }

  openEdit(sub: SubcategoryModel): void {
    this.isEditMode = true;
    this.currentSubId = sub._id;
    const catId = typeof sub.category === 'string' ? sub.category : sub.category?._id || '';
    this.subForm.patchValue({
      name: sub.name,
      category: catId,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSubcategory(): void {
    if (this.subForm.invalid) return;

    const { name, category } = this.subForm.value;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);

    if (this.isEditMode) {
      this._subService.updateSubcategory(this.currentSubId, formData).subscribe({
        next: () => {
          this._toast.showSuccess('Subcategory updated successfully');
          this.closeModal();
          this.loadData();
        },
        error: () => this._toast.showError('Failed to update subcategory')
      });
    } else {
      this._subService.createSubcategory(formData).subscribe({
        next: () => {
          this._toast.showSuccess('Subcategory created successfully');
          this.closeModal();
          this.loadData();
        },
        error: () => this._toast.showError('Failed to create subcategory')
      });
    }
  }

  deleteSubcategory(id: string): void {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    this._subService.deleteSubcategory(id).subscribe({
      next: () => {
        this._toast.showSuccess('Subcategory deleted');
        this.loadData();
      },
      error: () => this._toast.showError('Failed to delete subcategory')
    });
  }

  getCategoryName(sub: SubcategoryModel): string {
    if (typeof sub.category === 'object' && sub.category?.name) {
      return sub.category.name;
    }
    const match = this.categories.find(c => c._id === sub.category);
    return match ? match.name : 'Unknown';
  }
}
