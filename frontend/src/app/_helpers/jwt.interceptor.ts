import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccountService } from '@app/_services';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const accountService = inject(AccountService);
  const account = accountService.accountValue;
  const isLoggedIn = account && account.jwtToken;
  const isApiUrl = req.url.includes('/accounts');
  
  console.log('JWT Interceptor - URL:', req.url);
  console.log('JWT Interceptor - Method:', req.method);
  console.log('JWT Interceptor - Is logged in:', !!isLoggedIn);
  
  if (isLoggedIn && isApiUrl) {
    // Don't add auth header for login/register endpoints
    const skipAuth = req.url.includes('/authenticate') || 
                     req.url.includes('/register') || 
                     req.url.includes('/verify-email') ||
                     req.url.includes('/forgot-password') ||
                     req.url.includes('/validate-reset-token') ||
                     req.url.includes('/reset-password');
    
    if (!skipAuth) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${account.jwtToken}`
        }
      });
      console.log('JWT Interceptor - Added Authorization header');
    } else {
      console.log('JWT Interceptor - Skipping auth for this endpoint');
    }
  }
  
  return next(req);
};