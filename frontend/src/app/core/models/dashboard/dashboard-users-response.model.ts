import { UserModel } from '../auth/user.model';

export interface DashboardUsersResponseModel {
  results: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
    totalCount?: number;
    totalPages?: number;
  };
  data: UserModel[];
}
