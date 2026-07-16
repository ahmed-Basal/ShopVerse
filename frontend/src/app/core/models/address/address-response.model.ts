import { AddressModel } from './address.model';

export interface AddressResponseModel {
  status: string;
  message?: string;
  results?: number;
  data: AddressModel[];
}
