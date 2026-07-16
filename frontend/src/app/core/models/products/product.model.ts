export interface ProductModel {
  id: string;
  title: string;
  image: string;
  price: number;
  description: string;
  brand: string;
  model: string;
  color: string;
  category: string;
  discount: number;
  popular: boolean;
  isAddedToCart: boolean;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  _id?: string;
}
