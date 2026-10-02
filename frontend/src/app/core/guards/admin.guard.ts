import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../service/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.authorized()) {
    return router.createUrlTree(['login']);
  }

  if (auth.isAdmin()) {
    return true;
  }

  // Refresh role from backend in case role was upgraded
  return auth.refreshUserRole().pipe(
    map(() => {
      if (auth.isAdmin()) {
        return true;
      }
      return router.createUrlTree(['home']);
    }),
    catchError(() => of(router.createUrlTree(['home'])))
  );
};
