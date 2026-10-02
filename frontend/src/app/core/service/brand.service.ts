import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { BrandListResponseModel, BrandResponseModel } from '../models/brand/brand.model';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  constructor(private _http: HttpClient) {}

  getAllBrands(page: number = 1, limit: number = 50): Observable<BrandListResponseModel> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this._http.get<BrandListResponseModel>(API_ENDPOINTS.BRANDS, { params });
  }

  getBrand(id: string): Observable<BrandResponseModel> {
    return this._http.get<BrandResponseModel>(`${API_ENDPOINTS.BRANDS}/${id}`);
  }

  createBrand(data: FormData): Observable<BrandResponseModel> {
    return this._http.post<BrandResponseModel>(API_ENDPOINTS.BRANDS, data);
  }

  updateBrand(id: string, data: FormData): Observable<BrandResponseModel> {
    return this._http.put<BrandResponseModel>(`${API_ENDPOINTS.BRANDS}/${id}`, data);
  }

  deleteBrand(id: string): Observable<void> {
    return this._http.delete<void>(`${API_ENDPOINTS.BRANDS}/${id}`);
  }
}
