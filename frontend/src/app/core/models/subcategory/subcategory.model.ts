import { CategoryModel } from '../category/category.model';

export interface SubcategoryModel {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  categoryId?: string;
  category: string | CategoryModel;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}
