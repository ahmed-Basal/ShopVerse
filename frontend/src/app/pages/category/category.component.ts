import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../core/service/category.service';
import { SubcategoryService } from '../../core/service/subcategory.service';
import { CategoryModel } from '../../core/models/category/category.model';
import { SubcategoryModel } from '../../core/models/subcategory/subcategory.model';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  categories: CategoryModel[] = [];
  subcategories: SubcategoryModel[] = [];
  categorySubcategoriesMap: { [categoryId: string]: SubcategoryModel[] } = {};
  expandedCategories: { [categoryId: string]: boolean } = {};
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
        this.categories = res.data || [];
        this._subcategoryService.getAllSubcategories(1, 200).subscribe({
          next: (subRes) => {
            this.subcategories = subRes.data || [];
            this.mapSubcategories();
            this.loading = false;
          },
          error: () => {
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
    this.categories.forEach(cat => {
      this.categorySubcategoriesMap[cat._id] = [];
    });
    this.subcategories.forEach(sub => {
      const catId = typeof sub.category === 'object' ? sub.category._id : sub.category;
      if (this.categorySubcategoriesMap[catId]) {
        this.categorySubcategoriesMap[catId].push(sub);
      }
    });
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategories[categoryId] = !this.expandedCategories[categoryId];
  }

 getImageCategory(category: CategoryModel): string {
  if (category.image) {
   
    if (category.image.startsWith('http')) {
      return category.image;
    }
    
    return `http://localhost:8000/categories/${category.image}`;
  }

  const name = category.name.toLowerCase();
  const knownAssets = ['appliances', 'audio', 'gaming', 'laptop', 'mobile', 'tv'];
  if (knownAssets.includes(name)) {
    return `/assets/categories/${name}.jpg`;
  }
  return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
}
}
