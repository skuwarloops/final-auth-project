import { AccountService } from '@app/_services';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export function appInitializer(accountService: AccountService) {
  return () => accountService.refreshToken().pipe(catchError(() => of(null)));
}
