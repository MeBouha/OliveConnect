import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Role } from './models';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] ?? []) as Role[];
  const check = () => {
    const role = auth.user()?.role;
    return role && allowed.includes(role) ? true : router.createUrlTree(['/forbidden'], { queryParams: { returnUrl: state.url } });
  };
  if (auth.user()) {
    return check();
  }
  return auth.loadMe().pipe(
    map(() => check()),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
