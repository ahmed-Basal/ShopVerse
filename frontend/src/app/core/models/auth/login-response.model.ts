import { UserModel } from './user.model';

export interface LoginResponseModel {
  data: UserModel;
  token: string;
}
