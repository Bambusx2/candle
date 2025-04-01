import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="notifications-container">
      <div *ngFor="let notification of notifications$ | async" 
           [@slideInOut]
           class="notification" 
           [ngClass]="notification.type">
        <div class="notification-icon">
          <svg *ngIf="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z" fill="currentColor"/>
          </svg>
          <svg *ngIf="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"/>
          </svg>
          <svg *ngIf="notification.type === 'info'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" fill="currentColor"/>
          </svg>
          <svg *ngIf="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12.866 3l9.526 16.5a1 1 0 0 1-.866 1.5H2.474a1 1 0 0 1-.866-1.5L11.134 3a1 1 0 0 1 1.732 0zM11 16v2h2v-2h-2zm0-7v5h2V9h-2z" fill="currentColor"/>
          </svg>
        </div>
        <div class="notification-content">
          <p>{{ notification.message }}</p>
        </div>
        <button class="close-btn" (click)="dismiss(notification.id)" aria-label="Close notification">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 100%;
      width: 350px;
    }
    
    .notification {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slide-in 0.3s ease-out;
      background-color: #fff;
      border-left: 4px solid #ccc;
    }
    
    .success {
      border-left-color: #4CAF50;
    }
    
    .error {
      border-left-color: #F44336;
    }
    
    .info {
      border-left-color: #2196F3;
    }
    
    .warning {
      border-left-color: #FF9800;
    }
    
    .notification-icon {
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .success .notification-icon {
      color: #4CAF50;
    }
    
    .error .notification-icon {
      color: #F44336;
    }
    
    .info .notification-icon {
      color: #2196F3;
    }
    
    .warning .notification-icon {
      color: #FF9800;
    }
    
    .notification-content {
      flex: 1;
    }
    
    .notification-content p {
      margin: 0;
      line-height: 1.5;
    }
    
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #9e9e9e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    
    .close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  `]
})
export class NotificationComponent implements OnInit {
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {}

  dismiss(id: number): void {
    this.notificationService.remove(id);
  }
} 