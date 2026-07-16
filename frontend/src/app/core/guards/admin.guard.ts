import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../service/auth.service';

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  if (auth.authorized() && auth.isAdmin()) {
    return true;
  } else if (auth.authorized()) {
    return router.createUrlTree(['home']);
  } else {
    return router.createUrlTree(['login']);
  }
};
