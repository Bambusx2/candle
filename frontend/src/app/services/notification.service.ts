import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { scan, map } from 'rxjs/operators';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // Duration in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private counter = 0;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable().pipe(
    scan((notifications: Notification[], notification: Notification[]) => {
      return notification;
    }, [])
  );

  constructor() { }

  /**
   * Add a new notification
   */
  private add(notification: Omit<Notification, 'id'>): Notification {
    const id = this.counter++;
    const newNotification = { ...notification, id };
    
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotifications, newNotification]);
    
    // Auto-remove notification after duration (if specified)
    if (notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }
    
    return newNotification;
  }

  /**
   * Remove a notification by id
   */
  remove(id: number): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Success notification
   */
  success(message: string, duration: number = 3000): Notification {
    return this.add({
      type: 'success',
      message,
      duration
    });
  }

  /**
   * Error notification
   */
  error(message: string, duration: number = 5000): Notification {
    return this.add({
      type: 'error',
      message,
      duration
    });
  }

  /**
   * Info notification
   */
  info(message: string, duration: number = 3000): Notification {
    return this.add({
      type: 'info',
      message,
      duration
    });
  }

  /**
   * Warning notification
   */
  warning(message: string, duration: number = 4000): Notification {
    return this.add({
      type: 'warning',
      message,
      duration
    });
  }
} 