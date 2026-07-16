import { CartItemModel } from './cart-item.model';

export interface CartModel {
  _id: string;
  cartItems: CartItemModel[];
  totalCartPrice: number;
  totalPriceAfterDiscount?: number;
  user: string;
  createdAt?: string;
  updatedAt?: string;
}
