import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { ProductModel } from '../models/products/product.model';
import { ProductListResponseModel } from '../models/products/product-list-response.model';
import { ProductDetailsResponseModel } from '../models/products/product-details-response.model';
import { ProductCouponResponseModel } from '../models/products/product-coupon-response.model';
import { ProductAdminResponseModel } from '../models/products/product-admin-response.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  constructor(private _httpClient: HttpClient) {}

  mapProductToFrontend(prod: any): ProductModel {
    const categoryName = prod.category && typeof prod.category === 'object' && prod.category.name
      ? prod.category.name
      : prod.category
      ? prod.category.toString()
      : 'general';

    const brandName = prod.brand && typeof prod.brand === 'object' && prod.brand.name
      ? prod.brand.name
      : prod.brand
      ? prod.brand.toString()
      : 'Generic';

    return {
      id: prod._id || prod.id,
      title: prod.title,
      price: prod.price,
      description: prod.description || '',
      imageCover: prod.imageCover || '',
      brand: brandName,
      model: prod.slug || 'standard',
      color: prod.colors && prod.colors.length > 0 ? prod.colors[0] : 'Default',
      category: categoryName.toLowerCase(),
      discount: prod.priceAfterDiscount
        ? Math.round(((prod.price - prod.priceAfterDiscount) / prod.price) * 100)
        : 10,
      popular: (prod.sold || 0) > 25,
      isAddedToCart: false,
      ratingsAverage: prod.ratingsAverage,
      ratingsQuantity: prod.ratingsQuantity,
      _id: prod._id,
    };
  }

  allProducts(): Observable<ProductListResponseModel> {
    return this._httpClient.get<any>(API_ENDPOINTS.PRODUCTS).pipe(
      map((res) => ({
        ...res,
        products: (res.data || []).map((p: any) => this.mapProductToFrontend(p)),
        data: res.data || [],
      }))
    );
  }

  getProducts(queryParams: {
    keyword?: string;
    sort?: string;
    page?: number;
    limit?: number;
    categoryId?: string;
    brandId?: string;
    subCategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<ProductListResponseModel> {
    let params = new HttpParams();
    if (queryParams.keyword) params = params.set('keyword', queryParams.keyword);
    if (queryParams.sort) params = params.set('sort', queryParams.sort);
    if (queryParams.page) params = params.set('page', queryParams.page.toString());
    if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());
    if (queryParams.categoryId) params = params.set('categoryId', queryParams.categoryId);
    if (queryParams.brandId) params = params.set('brandId', queryParams.brandId);
    if (queryParams.subCategoryId) params = params.set('subCategoryId', queryParams.subCategoryId);
    if (queryParams.minPrice) params = params.set('minPrice', queryParams.minPrice.toString());
    if (queryParams.maxPrice) params = params.set('maxPrice', queryParams.maxPrice.toString());

    return this._httpClient.get<any>(API_ENDPOINTS.PRODUCTS, { params }).pipe(
      map((res) => ({
        ...res,
        products: (res.data || []).map((p: any) => this.mapProductToFrontend(p)),
        data: res.data || [],
      }))
    );
  }

  searchProducts(keyword: string): Observable<ProductListResponseModel> {
    return this._httpClient.get<any>(API_ENDPOINTS.PRODUCTS, {
      params: { keyword }
    }).pipe(
      map((res) => ({
        ...res,
        products: (res.data || []).map((p: any) => this.mapProductToFrontend(p)),
        data: res.data || [],
      }))
    );
  }

  getDetails(id: string): Observable<ProductDetailsResponseModel> {
    return this._httpClient.get<any>(`${API_ENDPOINTS.PRODUCTS}/${id}`).pipe(
      map((res) => ({
        ...res,
        data: {
          ...res.data,
          product: this.mapProductToFrontend(res.data.product ?? res.data),
        },
      }))
    );
  }

  applyProductCoupon(productId: string, couponCode: string): Observable<ProductCouponResponseModel> {
    return this._httpClient.post<ProductCouponResponseModel>(`${API_ENDPOINTS.PRODUCTS}/${productId}/apply-coupon`, { couponCode });
  }

  // Admin CRUD methods
  getAllProductsAdmin(page: number = 1, limit: number = 10): Observable<ProductListResponseModel> {
    return this._httpClient.get<any>(
      `${API_ENDPOINTS.ADMIN_PRODUCTS}?page=${page}&limit=${limit}`
    ).pipe(
      map((res) => ({
        ...res,
        products: (res.data || []).map((p: any) => this.mapProductToFrontend(p)),
        data: res.data || [],
      }))
    );
  }

  createProduct(productData: FormData): Observable<ProductAdminResponseModel> {
    return this._httpClient.post<ProductAdminResponseModel>(API_ENDPOINTS.ADMIN_PRODUCTS, productData);
  }

  updateProduct(id: string, productData: FormData): Observable<ProductAdminResponseModel> {
    return this._httpClient.put<ProductAdminResponseModel>(
      `${API_ENDPOINTS.ADMIN_PRODUCTS}/${id}`,
      productData
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this._httpClient.delete<void>(`${API_ENDPOINTS.ADMIN_PRODUCTS}/${id}`);
  }

  getAllBrands(): Observable<any> {
    return this._httpClient.get<any>(API_ENDPOINTS.BRANDS);
  }
}