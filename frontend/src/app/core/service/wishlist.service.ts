import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { WishlistResponseModel } from '../models/wishlist/wishlist-response.model';
import { WishlistActionResponseModel } from '../models/wishlist/wishlist-action-response.model';
import { WishlistAddRequestModel } from '../models/wishlist/wishlist-add-request.model';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  constructor(private _http: HttpClient) {}

  getWishlist(): Observable<WishlistResponseModel> {
    return this._http.get<WishlistResponseModel>(API_ENDPOINTS.WISHLIST);
  }

  addToWishlist(productId: string): Observable<WishlistActionResponseModel> {
    const body: WishlistAddRequestModel = { productId };
    return this._http.post<WishlistActionResponseModel>(API_ENDPOINTS.WISHLIST, body);
  }

  removeFromWishlist(productId: string): Observable<WishlistActionResponseModel> {
    return this._http.delete<WishlistActionResponseModel>(`${API_ENDPOINTS.WISHLIST}/${productId}`);
  }
}
