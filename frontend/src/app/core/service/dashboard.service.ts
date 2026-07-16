import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { DashboardStatsResponseModel } from '../models/dashboard/dashboard-stats-response.model';
import { DashboardUsersResponseModel } from '../models/dashboard/dashboard-users-response.model';
import { OrderListResponseModel } from '../models/orders/order-list-response.model';
import { OrderResponseModel } from '../models/orders/order-response.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private _http: HttpClient) {}

  getStats(): Observable<DashboardStatsResponseModel> {
    return this._http.get<DashboardStatsResponseModel>(API_ENDPOINTS.STATS);
  }

  getUsers(page: number = 1, limit: number = 10): Observable<DashboardUsersResponseModel> {
    return this._http.get<DashboardUsersResponseModel>(
      `${API_ENDPOINTS.USERS}?page=${page}&limit=${limit}`
    );
  }

  deleteUser(id: string): Observable<void> {
    return this._http.delete<void>(`${API_ENDPOINTS.USERS}/${id}`);
  }

  getOrders(page: number = 1, limit: number = 10): Observable<OrderListResponseModel> {
    return this._http.get<OrderListResponseModel>(
      `${API_ENDPOINTS.ORDERS}?page=${page}&limit=${limit}`
    );
  }

  updateOrderToPaid(id: string): Observable<OrderResponseModel> {
    return this._http.put<OrderResponseModel>(`${API_ENDPOINTS.ORDERS}/${id}/pay`, {});
  }

  updateOrderToDelivered(id: string): Observable<OrderResponseModel> {
    return this._http.put<OrderResponseModel>(`${API_ENDPOINTS.ORDERS}/${id}/deliver`, {});
  }
}
