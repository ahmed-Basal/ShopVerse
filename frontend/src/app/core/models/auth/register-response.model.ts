import { UserModel } from './user.model';

export interface RegisterResponseModel {
  data: UserModel;
  token: string;
}
