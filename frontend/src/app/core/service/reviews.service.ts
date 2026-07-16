import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../apiRoot/baseUrl';
import { ReviewListResponseModel } from '../models/reviews/review-list-response.model';
import { ReviewResponseModel } from '../models/reviews/review-response.model';
import { ReviewRequestModel } from '../models/reviews/review-request.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  constructor(private _http: HttpClient) {}

  getProductReviews(productId: string, page: number = 1, limit: number = 5): Observable<ReviewListResponseModel> {
    return this._http.get<ReviewListResponseModel>(`${baseUrl}/api/v1/products/${productId}/reviews?page=${page}&limit=${limit}`);
  }

  createReview(review: ReviewRequestModel): Observable<ReviewResponseModel> {
    return this._http.post<ReviewResponseModel>(`${baseUrl}/api/v1/reviews`, review);
  }
}
