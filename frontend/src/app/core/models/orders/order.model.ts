import { UserModel } from '../auth/user.model';
import { OrderItemModel } from './order-item.model';

export interface OrderModel {
  _id: string;
  user: UserModel;
  cartItems: OrderItemModel[];
  taxPrice?: number;
  shippingAddress?: {
    details?: string;
    phone?: string;
    city?: string;
    postalCode?: string;
  };
  shippingPrice?: number;
  totalOrderPrice: number;
  paymentMethodType?: 'card' | 'cash';
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
