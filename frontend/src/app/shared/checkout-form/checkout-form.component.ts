import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.scss'
})
export class CheckoutFormComponent implements OnInit {
  @Output() checkoutSubmit = new EventEmitter<{ shippingAddress: any; paymentMethod: string }>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      city: new FormControl('', [Validators.required]),
      details: new FormControl('', [Validators.required]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^01[0125][0-9]{8}$/) // Egyptian mobile number validation
      ]),
      paymentMethod: new FormControl('card', [Validators.required])
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { city, details, phone, paymentMethod } = this.form.value;
    this.checkoutSubmit.emit({
      shippingAddress: { city, details, phone },
      paymentMethod
    });
  }

  cancel(): void {
    this.close.emit();
  }
}
