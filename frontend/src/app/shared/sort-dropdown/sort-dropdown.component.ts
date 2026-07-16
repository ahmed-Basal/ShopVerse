import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-sort-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sort-dropdown.component.html',
  styleUrl: './sort-dropdown.component.scss'
})
export class SortDropdownComponent {
  @Input() options: SortOption[] = [];
  @Input() selectedValue: string = '';
  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    const matched = this.options.find(opt => opt.value === this.selectedValue);
    return matched ? matched.label : 'Sort by';
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  selectOption(option: SortOption): void {
    this.selectedValue = option.value;
    this.selectionChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
