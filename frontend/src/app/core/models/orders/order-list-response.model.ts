import { OrderModel } from './order.model';

export interface OrderListResponseModel {
  results?: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
    totalCount?: number;
    totalPages?: number;
  };
  data: OrderModel[];
}
