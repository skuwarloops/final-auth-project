import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AccountService } from './_services';
import { appInitializer } from './_helpers';
import { jwtInterceptor } from './_helpers/jwt.interceptor';
import { errorInterceptor } from './_helpers/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])  // fake-backend REMOVED
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [AccountService]
    }
  ]
};