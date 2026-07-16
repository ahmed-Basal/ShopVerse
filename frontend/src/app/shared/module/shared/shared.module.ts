import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { PasswordModule } from 'primeng/password';

@NgModule({
  declarations: [],
  imports: [
    ReactiveFormsModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ButtonModule,
    MessagesModule,
    NgxSpinnerModule,
    AutoFocusModule,
    PasswordModule,
  ],
  exports: [
    ReactiveFormsModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    ButtonModule,
    MessagesModule,
    NgxSpinnerModule,
    AutoFocusModule,
    PasswordModule,
  ],
})
export class SharedModule {}
