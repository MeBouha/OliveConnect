import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Logs API errors and sends the user back to login when their session has expired. */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  // Resolved lazily: AuthService itself issues requests while it is being constructed.
  const injector = inject(Injector);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.error?.message ?? error.message ?? 'Erreur inconnue';
      console.error(`[${error.status}] ${message}`);
      const isAuthCall = request.url.includes('/auth/login') || request.url.includes('/auth/register');
      const auth = injector.get(AuthService);
      if (error.status === 401 && !isAuthCall && auth.isLoggedIn()) {
        const router = injector.get(Router);
        auth.logout();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url, expired: 1 } });
      }
      return throwError(() => error);
    })
  );
};
