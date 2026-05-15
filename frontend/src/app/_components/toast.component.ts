import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '@app/_services/toast.service';
import { Toast } from '@app/_models/toast';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="toast" class="toast-container" [class.hide]="hideToast">
      <div class="toast-notification" [class]="'toast-' + toast.type">
        <div class="toast-content">
          <div class="toast-icon">
            <span *ngIf="toast.type === 'success'">✓</span>
            <span *ngIf="toast.type === 'error'">✗</span>
            <span *ngIf="toast.type === 'info'">ℹ</span>
            <span *ngIf="toast.type === 'warning'">⚠</span>
          </div>
          <div class="toast-message" [innerHTML]="toast.message"></div>
        </div>
        <button class="toast-close" (click)="closeToast()">×</button>
      </div>
      <div class="toast-progress" [class]="'progress-' + toast.type">
        <div class="toast-progress-bar" [style.animation]="'progress 3s linear forwards'"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      max-width: 450px;
      animation: slideIn 0.3s ease-out;
    }

    .toast-container.hide {
      animation: fadeOut 0.3s ease-out forwards;
    }

    .toast-notification {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      position: relative;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
      color: #333;
    }

    .toast-close {
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #333;
    }

    .toast-success {
      border-left: 4px solid #10b981;
    }
    .toast-success .toast-icon {
      background: #10b981;
      color: white;
    }

    .toast-error {
      border-left: 4px solid #ef4444;
    }
    .toast-error .toast-icon {
      background: #ef4444;
      color: white;
    }

    .toast-info {
      border-left: 4px solid #3b82f6;
    }
    .toast-info .toast-icon {
      background: #3b82f6;
      color: white;
    }

    .toast-warning {
      border-left: 4px solid #f59e0b;
    }
    .toast-warning .toast-icon {
      background: #f59e0b;
      color: white;
    }

    .toast-progress {
      height: 3px;
      background: #f0f0f0;
    }

    .toast-progress-bar {
      height: 100%;
      width: 100%;
      background: #10b981;
      transform-origin: left;
    }

    .progress-error .toast-progress-bar {
      background: #ef4444;
    }

    .progress-info .toast-progress-bar {
      background: #3b82f6;
    }

    .progress-warning .toast-progress-bar {
      background: #f59e0b;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes progress {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: Toast | null = null;
  hideToast = false;
  private subscription: Subscription | null = null;
  private timeoutId: any = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      // Clear existing timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      this.toast = toast;
      this.hideToast = false;
      
      if (toast) {
        // Auto hide after 3 seconds
        this.timeoutId = setTimeout(() => {
          this.hideToast = true;
          // Remove toast after animation
          setTimeout(() => {
            this.toast = null;
            this.toastService.clear();
          }, 300);
        }, 3000);
      }
    });
  }

  closeToast() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.hideToast = true;
    setTimeout(() => {
      this.toast = null;
      this.toastService.clear();
    }, 300);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}