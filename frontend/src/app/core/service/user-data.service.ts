import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  userName: BehaviorSubject<string> = new BehaviorSubject<string>(
    typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''
  );
}
