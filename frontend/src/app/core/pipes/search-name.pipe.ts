import { Pipe, PipeTransform } from '@angular/core';
import { ProductModel } from '../models/products/product.model';

@Pipe({
  name: 'searchName',
  standalone: true,
})
export class SearchNamePipe implements PipeTransform {
  transform(products: ProductModel[], searchKey: string): ProductModel[] {
    return products.filter((products) =>
      products.title.toLowerCase().includes(searchKey.toLowerCase())
    );
  }
}
