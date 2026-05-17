import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const writerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Permite acceso si el usuario tiene rol escritor (1) o ambos (2)
  if (auth.isWriter()) return true;
  return router.createUrlTree(['/home']);
};
