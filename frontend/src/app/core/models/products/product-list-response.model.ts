import { ProductModel } from './product.model';
import { RawProductModel } from './raw-product.model';

export interface ProductListResponseModel {
  status: string;
  message?: string;
  results: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
    totalCount?: number;
    totalPages?: number;
  };
  products: ProductModel[];
  data: RawProductModel[];
}
