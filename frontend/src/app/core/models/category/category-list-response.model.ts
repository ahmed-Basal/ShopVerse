import { CategoryModel } from './category.model';

export interface CategoryListResponseModel {
  results: number;
  data: CategoryModel[];
}
