import { Injectable, OnDestroy, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotifecationsService } from './notifecations.service';
import { AuthService } from './auth.service';
import { NotificationModel } from '../models/notification/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private eventSource: EventSource | null = null;
  notifications$ = new BehaviorSubject<NotificationModel[]>([]);
  unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private _toast: NotifecationsService, private _injector: Injector) {
    setTimeout(() => {
      const auth = this._injector.get(AuthService);
      auth.isLoggedIn$.subscribe((loggedIn) => {
        if (loggedIn) {
          this.connect();
        } else {
          this.disconnect();
        }
      });
    });
  }

  connect(): void {
    if (this.eventSource) return;
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.eventSource = new EventSource(`http://localhost:8000/api/v1/notifications/stream?token=${token}`);

    this.eventSource.addEventListener('order_confirmed', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Event received:', data);
        
        this._toast.showSuccess('Order Confirmed!', data.message || 'Your order was successfully paid.');

        const currentList = this.notifications$.value;
        const newNotification = {
          id: data.orderId || Date.now().toString(),
          message: data.message,
          timestamp: new Date(),
          read: false
        };
        this.notifications$.next([newNotification, ...currentList]);
        this.unreadCount$.next(this.unreadCount$.value + 1);
      } catch (err) {
        console.error('Error parsing SSE event data:', err);
      }
    });

    this.eventSource.onerror = (error) => {
      console.warn('SSE EventSource error, will auto-reconnect:', error);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE EventSource disconnected.');
    }
    this.notifications$.next([]);
    this.unreadCount$.next(0);
  }

  markAllAsRead(): void {
    const list = this.notifications$.value.map(n => ({ ...n, read: true }));
    this.notifications$.next(list);
    this.unreadCount$.next(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
