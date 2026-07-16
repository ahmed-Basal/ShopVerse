import { RawProductModel } from '../products/raw-product.model';

export interface WishlistResponseModel {
  status: string;
  results?: number;
  data: RawProductModel[];
}
