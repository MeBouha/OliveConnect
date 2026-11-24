import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';
import { AuthResponse, LoginRequest, MeResponse, RegisterRequest, Role } from './models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenKey = 'oliveconnect_token';
  private readonly userState = signal<MeResponse | null>(null);

  readonly user = this.userState.asReadonly();

  constructor() {
    if (this.isLoggedIn()) {
      this.loadMe().subscribe({ error: () => this.logout() });
    }
  }

  /** True when the signed-in user has one of the given roles (ADMIN always passes). */
  hasRole(...roles: Role[]): boolean {
    const role = this.userState()?.role;
    return !!role && (role === 'ADMIN' || roles.includes(role));
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  login(request: LoginRequest): Observable<MeResponse> {
    return this.api.post<AuthResponse>('/auth/login', request).pipe(
      switchMap(response => this.storeToken(response)),
      switchMap(() => this.loadMe())
    );
  }

  register(request: RegisterRequest): Observable<MeResponse> {
    return this.api.post<AuthResponse>('/auth/register', request).pipe(
      switchMap(response => this.storeToken(response)),
      switchMap(() => this.loadMe())
    );
  }

  loadMe(): Observable<MeResponse> {
    return this.api.get<MeResponse>('/auth/me').pipe(tap(user => this.userState.set(user)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.userState.set(null);
  }

  private storeToken(response: AuthResponse): Observable<AuthResponse> {
    localStorage.setItem(this.tokenKey, response.token);
    return of(response);
  }
}
