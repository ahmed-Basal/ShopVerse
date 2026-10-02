import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/service/category.service';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ImageUrlPipe],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  categories: CategoryModel[] = [];
  subcategories: SubcategoryModel[] = [];
  categorySubcategoriesMap: { [categoryId: string]: SubcategoryModel[] } = {};
  expandedCategories: { [categoryId: string]: boolean } = {};
  searchQuery: string = '';
  loading = false;

  constructor(
    private _categoryService: CategoryService,
    private _subcategoryService: SubcategoryService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this._categoryService.getAllCategory().subscribe({
      next: (res) => {
        // Ensure every category has both id and _id normalized
        this.categories = (res.data || []).map((cat: any) => ({
          ...cat,
          id: cat.id || cat._id,
          _id: cat._id || cat.id,
        }));

        this._subcategoryService.getAllSubcategories(1, 300).subscribe({
          next: (subRes) => {
            this.subcategories = (subRes.data || []).map((sub: any) => ({
              ...sub,
              id: sub.id || sub._id,
              _id: sub._id || sub.id,
            }));
            this.mapSubcategories();
            this.loading = false;
          },
          error: () => {
            this.mapSubcategories();
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  mapSubcategories(): void {
    this.categorySubcategoriesMap = {};

    // Initialize with direct nested subcategories if provided by API
    this.categories.forEach((cat) => {
      const catId = (cat.id || cat._id || '') as string;
      const initial = Array.isArray((cat as any).subcategories) ? (cat as any).subcategories : [];
      this.categorySubcategoriesMap[catId] = initial.map((s: any) => ({
        ...s,
        id: s.id || s._id,
        _id: s._id || s.id,
      }));
    });

    // Merge from global subcategories list
    this.subcategories.forEach((sub) => {
      const parentCat = typeof sub.category === 'object'
        ? (sub.category as any)?.id || (sub.category as any)?._id
        : sub.category;

      if (parentCat && this.categorySubcategoriesMap[parentCat]) {
        const subId = sub.id || sub._id;
        const exists = this.categorySubcategoriesMap[parentCat].some(
          (s) => (s.id || s._id) === subId
        );
        if (!exists) {
          this.categorySubcategoriesMap[parentCat].push(sub);
        }
      }
    });
  }

  toggleCategory(categoryId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedCategories[categoryId] = !this.expandedCategories[categoryId];
  }

  get filteredCategories(): CategoryModel[] {
    const query = (this.searchQuery || '').trim().toLowerCase();
    if (!query) {
      return this.categories;
    }
    return this.categories.filter((cat) => {
      const nameMatch = (cat.name || '').toLowerCase().includes(query);
      const subMatch = (this.categorySubcategoriesMap[cat.id || cat._id] || []).some((sub) =>
        (sub.name || '').toLowerCase().includes(query)
      );
      return nameMatch || subMatch;
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
  }
}
