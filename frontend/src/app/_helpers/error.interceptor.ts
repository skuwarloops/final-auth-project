import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { AccountService } from '@app/_services';

export function errorInterceptor(request: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const accountService = inject(AccountService);
  return next(request).pipe(catchError((err: any) => {
    if ([401, 403].includes(err.status) && accountService.accountValue) {
      accountService.logout();
    }
    const error = err.error?.message || err.statusText;
    return throwError(() => error);
  }));
}
