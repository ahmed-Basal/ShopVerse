export interface UserModel {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
