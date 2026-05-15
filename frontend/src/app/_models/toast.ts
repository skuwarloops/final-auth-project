export class Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  autoClose: boolean;
  fade: boolean;
  
  constructor(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', autoClose = true) {
    this.message = message;
    this.type = type;
    this.autoClose = autoClose;
    this.fade = false;
  }
}