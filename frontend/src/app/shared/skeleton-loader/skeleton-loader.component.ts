import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss'
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'list' = 'card';
  @Input() count: number = 4;

  get array(): number[] {
    return Array(this.count).fill(0);
  }
}
