export interface RawProductModel {
  _id: string;
  title: string;
  slug: string;
  description: string;
  quantity: number;
  sold?: number;
  price: number;
  priceAfterDiscount?: number;
  colors?: string[];
  imageCover: string;
  images?: string[];
  category: { _id: string; name: string } | string;
  brand?: { _id: string; name: string } | string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}
