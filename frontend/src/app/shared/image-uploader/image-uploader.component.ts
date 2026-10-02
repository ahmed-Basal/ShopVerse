import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUrlPipe } from '../../core/pipes/image-url.pipe';

export interface ImageUploadEvent {
  mode: 'file' | 'url';
  file: File | null;
  url: string;
  previewUrl: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
})
export class ImageUploaderComponent implements OnInit, OnChanges {
  @Input() label: string = 'Image';
  @Input() required: boolean = false;
  @Input() initialUrl: string = '';
  @Input() placeholder: string = 'https://example.com/image.jpg';
  @Input() hint: string = 'Upload a local image file or paste a web URL.';

  @Output() imageChange = new EventEmitter<ImageUploadEvent>();
  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() urlEntered = new EventEmitter<string>();

  activeMode: 'file' | 'url' = 'file';
  selectedFile: File | null = null;
  enteredUrl: string = '';
  previewUrl: string = '';
  isDragging: boolean = false;
  copied: boolean = false;
  imageLoadError: boolean = false;

  ngOnInit(): void {
    if (this.initialUrl) {
      this.previewUrl = this.initialUrl;
      this.enteredUrl = this.initialUrl;
      this.activeMode = this.initialUrl.startsWith('http') ? 'url' : 'file';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialUrl'] && changes['initialUrl'].currentValue !== undefined) {
      const val = changes['initialUrl'].currentValue;
      if (val && !this.selectedFile) {
        this.previewUrl = val;
        this.enteredUrl = val;
      } else if (!val && !this.selectedFile) {
        this.previewUrl = '';
        this.enteredUrl = '';
      }
    }
  }

  switchMode(mode: 'file' | 'url'): void {
    this.activeMode = mode;
    this.imageLoadError = false;
    if (mode === 'url') {
      if (this.enteredUrl) {
        this.previewUrl = this.enteredUrl;
        this.emitChange();
      }
    } else {
      if (this.selectedFile) {
        this.readAndPreview(this.selectedFile);
      } else if (this.initialUrl) {
        this.previewUrl = this.initialUrl;
      }
    }
  }

  onFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    this.selectedFile = file;
    this.enteredUrl = '';
    this.imageLoadError = false;
    this.readAndPreview(file);
    this.fileSelected.emit(file);
    this.emitChange();
  }

  readAndPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.emitChange();
    };
    reader.readAsDataURL(file);
  }

  onUrlChange(url: string): void {
    this.enteredUrl = url.trim();
    this.imageLoadError = false;
    this.selectedFile = null;
    this.previewUrl = this.enteredUrl;
    this.urlEntered.emit(this.enteredUrl);
    this.emitChange();
  }

  onImgError(): void {
    this.imageLoadError = true;
  }

  clear(): void {
    this.selectedFile = null;
    this.enteredUrl = '';
    this.previewUrl = '';
    this.imageLoadError = false;
    this.fileSelected.emit(null);
    this.urlEntered.emit('');
    this.emitChange();
  }

  copyLink(): void {
    if (!this.previewUrl) return;
    navigator.clipboard.writeText(this.previewUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  emitChange(): void {
    this.imageChange.emit({
      mode: this.activeMode,
      file: this.selectedFile,
      url: this.enteredUrl,
      previewUrl: this.previewUrl,
    });
  }
}
