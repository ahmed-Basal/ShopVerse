import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { SubcategoryListResponseModel } from '../models/subcategory/subcategory-list-response.model';
import { SubcategoryResponseModel } from '../models/subcategory/subcategory-response.model';

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService {
  constructor(private _HttpClient: HttpClient) {}

  getAllSubcategories(page: number = 1, limit: number = 100): Observable<SubcategoryListResponseModel> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this._HttpClient.get<SubcategoryListResponseModel>(API_ENDPOINTS.SUBCATEGORIES, { params });
  }

  getSubcategoriesByCategory(categoryId: string): Observable<SubcategoryListResponseModel> {
    const params = new HttpParams().set('category', categoryId).set('limit', '100');
    return this._HttpClient.get<SubcategoryListResponseModel>(API_ENDPOINTS.SUBCATEGORIES, { params });
  }

  getSubcategory(id: string): Observable<SubcategoryResponseModel> {
    return this._HttpClient.get<SubcategoryResponseModel>(`${API_ENDPOINTS.SUBCATEGORIES}/${id}`);
  }

  // Admin Methods (accepting FormData to support optional image uploads)
  createSubcategory(data: FormData): Observable<SubcategoryResponseModel> {
    return this._HttpClient.post<SubcategoryResponseModel>(API_ENDPOINTS.ADMIN_SUBCATEGORIES, data);
  }

  updateSubcategory(id: string, data: FormData): Observable<SubcategoryResponseModel> {
    return this._HttpClient.put<SubcategoryResponseModel>(`${API_ENDPOINTS.ADMIN_SUBCATEGORIES}/${id}`, data);
  }

  deleteSubcategory(id: string): Observable<void> {
    return this._HttpClient.delete<void>(`${API_ENDPOINTS.ADMIN_SUBCATEGORIES}/${id}`);
  }
}
