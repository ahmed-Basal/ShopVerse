export interface ReviewModel {
  _id: string;
  title: string;
  ratings: number;
  user: { _id: string; name: string };
  product: string;
  createdAt?: string;
  updatedAt?: string;
}
