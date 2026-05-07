import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = err.error?.detail || err.error?.message || 'Error inesperado';
      console.error(`[API ${err.status}] ${req.url}: ${message}`);
      return throwError(() => ({ status: err.status, message }));
    })
  );
};
