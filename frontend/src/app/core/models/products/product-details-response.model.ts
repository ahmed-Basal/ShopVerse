import { ProductModel } from './product.model';
import { RawProductModel } from './raw-product.model';

export interface ProductDetailsResponseModel {
  status: string;
  product: ProductModel;
  data: RawProductModel;
}
