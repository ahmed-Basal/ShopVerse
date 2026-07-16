import { Pipe, PipeTransform } from '@angular/core';
import { ProductModel } from '../models/products/product.model';

@Pipe({
  name: 'popular',
  standalone: true,
})
export class PopularPipe implements PipeTransform {
  transform(products: ProductModel[]): ProductModel[] {
    return products?.filter((product) => product?.popular === true);
  }
}
