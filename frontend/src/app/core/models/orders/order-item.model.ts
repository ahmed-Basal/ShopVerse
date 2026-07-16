export interface OrderItemModel {
  _id?: string;
  product: {
    _id?: string;
    title: string;
    imageCover: string;
  };
  quantity: number;
  color: string;
  price: number;
}
