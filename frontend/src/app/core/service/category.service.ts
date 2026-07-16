import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { CategoryListResponseModel } from '../models/category/category-list-response.model';
import { CategoryResponseModel } from '../models/category/category-response.model';
import { ProductListResponseModel } from '../models/products/product-list-response.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private _HttpClient: HttpClient) {}

  getAllCategory(): Observable<CategoryListResponseModel> {
    return this._HttpClient.get<CategoryListResponseModel>(API_ENDPOINTS.CATEGORIES);
  }

  getSpecificCategory(typeCategory: string): Observable<ProductListResponseModel> {
    // Rely directly on the backend's ?categoryName filter support on products route
    return this._HttpClient.get<ProductListResponseModel>(API_ENDPOINTS.PRODUCTS, {
      params: { categoryName: typeCategory },
    });
  }

  // Admin methods
  getAllCategoriesAdmin(): Observable<CategoryListResponseModel> {
    return this._HttpClient.get<CategoryListResponseModel>(API_ENDPOINTS.ADMIN_CATEGORIES);
  }

  createCategory(data: any): Observable<CategoryResponseModel> {
    return this._HttpClient.post<CategoryResponseModel>(API_ENDPOINTS.ADMIN_CATEGORIES, data);
  }

  getCategory(id: string): Observable<CategoryResponseModel> {
    return this._HttpClient.get<CategoryResponseModel>(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${id}`);
  }

  updateCategory(id: string, categoryData: FormData): Observable<CategoryResponseModel> {
    return this._HttpClient.put<CategoryResponseModel>(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<void> {
    return this._HttpClient.delete<void>(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${id}`);
  }
}
