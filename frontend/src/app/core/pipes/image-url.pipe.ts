import { Pipe, PipeTransform } from '@angular/core';
import { baseUrl } from '../apiRoot/baseUrl';

@Pipe({
  name: 'imageUrl',
  standalone: true,
})
export class ImageUrlPipe implements PipeTransform {
  transform(fileName: string | undefined | null): string {
    if (!fileName || typeof fileName !== 'string') {
      return './assets/product-1.jpg';
    }

    let trimmed = fileName.trim().replace(/\\/g, '/');
    if (!trimmed) {
      return './assets/product-1.jpg';
    }

    // Direct web URLs or data URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // Local assets
    if (trimmed.startsWith('./assets') || trimmed.startsWith('/assets') || trimmed.startsWith('assets/')) {
      return trimmed.startsWith('/') ? `.${trimmed}` : trimmed;
    }

    // Already has leading slash
    if (trimmed.startsWith('/')) {
      return `${baseUrl}${trimmed}`;
    }

    // Known subdirectories
    if (
      trimmed.startsWith('products/') ||
      trimmed.startsWith('categories/') ||
      trimmed.startsWith('subcategories/') ||
      trimmed.startsWith('brands/') ||
      trimmed.startsWith('uploads/')
    ) {
      return `${baseUrl}/${trimmed}`;
    }

    // Bare filenames from Sharp uploads
    if (trimmed.startsWith('product-')) {
      return `${baseUrl}/products/${trimmed}`;
    }
    if (trimmed.startsWith('category-')) {
      return `${baseUrl}/categories/${trimmed}`;
    }
    if (trimmed.startsWith('subcategory-')) {
      return `${baseUrl}/subcategories/${trimmed}`;
    }
    if (trimmed.startsWith('brand-')) {
      return `${baseUrl}/brands/${trimmed}`;
    }
    if (trimmed.startsWith('user-')) {
      return `${baseUrl}/users/${trimmed}`;
    }

    // Default fallback to products directory
    return `${baseUrl}/products/${trimmed}`;
  }
}