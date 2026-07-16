import { ReviewModel } from './review.model';

export interface ReviewListResponseModel {
  results: number;
  data: ReviewModel[];
}
