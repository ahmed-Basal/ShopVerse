import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../apiRoot/baseUrl';
import { AddressModel } from '../models/address/address.model';
import { AddressResponseModel } from '../models/address/address-response.model';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  constructor(private _http: HttpClient) {}

  getAddresses(): Observable<AddressResponseModel> {
    return this._http.get<AddressResponseModel>(API_ENDPOINTS.ADDRESSES);
  }

  addAddress(address: AddressModel): Observable<AddressResponseModel> {
    return this._http.post<AddressResponseModel>(API_ENDPOINTS.ADDRESSES, address);
  }

  updateAddress(addressId: string, address: AddressModel): Observable<AddressResponseModel> {
    return this._http.put<AddressResponseModel>(`${API_ENDPOINTS.ADDRESSES}/${addressId}`, address);
  }

  removeAddress(addressId: string): Observable<AddressResponseModel> {
    return this._http.delete<AddressResponseModel>(`${API_ENDPOINTS.ADDRESSES}/${addressId}`);
  }
}
