import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Toast } from '@app/_models/toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast | null>();
  toast$ = this.toastSubject.asObservable();

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  warning(message: string) {
    this.show(message, 'warning');
  }

  clear() {
    this.toastSubject.next(null);
  }

  private show(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    const toast = new Toast(message, type);
    this.toastSubject.next(toast);
    
    // Auto remove after 5 seconds
    if (toast.autoClose) {
      setTimeout(() => {
        this.toastSubject.next(null);
      }, 5000);
    }
  }
}