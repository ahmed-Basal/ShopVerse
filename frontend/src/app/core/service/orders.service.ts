import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { OrderListResponseModel } from '../models/orders/order-list-response.model';
import { OrderResponseModel } from '../models/orders/order-response.model';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  constructor(private _http: HttpClient) {}

  getOrders(): Observable<OrderListResponseModel> {
    return this._http.get<OrderListResponseModel>(API_ENDPOINTS.ORDERS);
  }

  getOrder(orderId: string): Observable<OrderResponseModel> {
    return this._http.get<OrderResponseModel>(`${API_ENDPOINTS.ORDERS}/${orderId}`);
  }
}
