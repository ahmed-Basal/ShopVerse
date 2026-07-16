import { ProductModel } from '../products/product.model';

export interface CartItemModel {
  _id?: string;
  product: ProductModel | string;
  quantity: number;
  color: string;
  price: number;
}
