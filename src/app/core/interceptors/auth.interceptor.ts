import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Session expired / token invalid / account deactivated → force sign out
      // instead of silently showing empty screens (DataService swallows errors).
      // Skip the auth endpoints so a bad login/refresh doesn't trigger a bounce.
      const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
      if ((err.status === 401 || err.status === 403) && auth.isLoggedIn && !isAuthCall) {
        toast.error('Your session has expired. Please sign in again.');
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
