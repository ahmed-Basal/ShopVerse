import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Search...';
  
  private _initialValue: string = '';
  @Input() set initialValue(val: string) {
    this._initialValue = val;
    this.value = val;
  }
  get initialValue(): string {
    return this._initialValue;
  }

  @Output() search = new EventEmitter<string>();

  value: string = '';
  private inputSubject = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.value = this.initialValue;
    this.sub = this.inputSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.search.emit(val);
    });
  }

  onInput(event: Event): void {
    const inputVal = (event.target as HTMLInputElement).value;
    this.value = inputVal;
    this.inputSubject.next(inputVal);
  }

  clear(): void {
    this.value = '';
    this.inputSubject.next('');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
