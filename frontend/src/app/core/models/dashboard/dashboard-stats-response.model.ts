import { OrderModel } from '../orders/order.model';

export interface DashboardStatsResponseModel {
  status: string;
  data: {
    usersCount: number;
    productsCount: number;
    ordersCount: number;
    categoriesCount: number;
    totalRevenue: number;
    recentOrders: OrderModel[];
  };
}
