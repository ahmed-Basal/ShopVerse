export interface BrandModel {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandListResponseModel {
  results: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
    totalCount: number;
  };
  data: BrandModel[];
}

export interface BrandResponseModel {
  data: BrandModel;
}
