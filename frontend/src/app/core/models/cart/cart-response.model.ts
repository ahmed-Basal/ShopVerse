import { CartModel } from './cart.model';

export interface CartResponseModel {
  status: string;
  message?: string;
  numOfCartItems: number;
  data: CartModel;
}
