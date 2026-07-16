import { CategoryModel } from '../category/category.model';

export interface SubcategoryModel {
  _id: string;
  name: string;
  slug: string;
  category: string | CategoryModel;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}
