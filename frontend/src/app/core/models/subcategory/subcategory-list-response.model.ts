import { SubcategoryModel } from './subcategory.model';

export interface SubcategoryListResponseModel {
  results: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
  };
  data: SubcategoryModel[];
}
