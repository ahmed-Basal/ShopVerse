import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-auth-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './auth-nav.component.html',
  styleUrls: [],
})
export class AuthNavComponent {}
