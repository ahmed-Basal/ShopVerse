import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
      image: prod.imageCover || '',
      brand: brandName,
      model: prod.slug || 'standard',
      color: prod.colors && prod.colors.length > 0 ? prod.colors[0] : 'Default',
      category: categoryName.toLowerCase(),
      discount: prod.priceAfterDiscount
        ? Math.round(((prod.price - prod.priceAfterDiscount) / prod.price) * 100)
        : 10,
      popular: (prod.sold || 0) > 25,
      isAddedToCart: false,
    };
  }

  allProducts(): Observable<ProductListResponseModel> {
    return this._httpClient.get<ProductListResponseModel>(API_ENDPOINTS.PRODUCTS);
  }

  getProducts(queryParams: { keyword?: string; sort?: string; page?: number; limit?: number }): Observable<ProductListResponseModel> {
    let params = new HttpParams();
    if (queryParams.keyword) params = params.set('keyword', queryParams.keyword);
    if (queryParams.sort) params = params.set('sort', queryParams.sort);
    if (queryParams.page) params = params.set('page', queryParams.page.toString());
    if (queryParams.limit) params = params.set('limit', queryParams.limit.toString());

    return this._httpClient.get<ProductListResponseModel>(API_ENDPOINTS.PRODUCTS, { params });
  }

  searchProducts(keyword: string): Observable<ProductListResponseModel> {
    return this._httpClient.get<ProductListResponseModel>(API_ENDPOINTS.PRODUCTS, {
      params: { keyword }
    });
  }

  getDetails(id: string): Observable<ProductDetailsResponseModel> {
    return this._httpClient.get<ProductDetailsResponseModel>(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  }

  applyProductCoupon(productId: string, couponCode: string): Observable<ProductCouponResponseModel> {
    return this._httpClient.post<ProductCouponResponseModel>(`${API_ENDPOINTS.PRODUCTS}/${productId}/apply-coupon`, { couponCode });
  }

  // Admin CRUD methods
  getAllProductsAdmin(page: number = 1, limit: number = 10): Observable<ProductListResponseModel> {
    return this._httpClient.get<ProductListResponseModel>(
      `${API_ENDPOINTS.ADMIN_PRODUCTS}?page=${page}&limit=${limit}`
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
