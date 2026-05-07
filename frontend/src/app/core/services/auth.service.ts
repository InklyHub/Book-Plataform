import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenResponse, User } from '../models';

const ACCESS_KEY = 'bp_access';
const REFRESH_KEY = 'bp_refresh';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isWriter = computed(() => this._user()?.role === 'writer');
  readonly coins = computed(() => this._user()?.coins ?? 0);

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  register(email: string, username: string, password: string, role = 'reader'): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/auth/register', { email, username, password, role }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  login(email: string, password: string): Observable<TokenResponse> {
    return this.api.post<TokenResponse>('/auth/login', { email, password }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refresh_token = localStorage.getItem(REFRESH_KEY);
    return this.api.post<TokenResponse>('/auth/refresh', { refresh_token }).pipe(
      tap(res => this.saveTokens(res))
    );
  }

  saveOnboardingGenres(genres: string[]): Observable<User> {
    return this.api.post<User>('/auth/onboarding', { genres }).pipe(
      tap(user => this._user.set(user))
    );
  }

  loadProfile(): Observable<User> {
    return this.api.get<User>('/users/me').pipe(
      tap(user => this._user.set(user))
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.api.patch<User>('/users/me', data).pipe(
      tap(user => this._user.set(user))
    );
  }

  switchToWriter(): Observable<{ access_token: string; refresh_token: string; role: string }> {
    return this.api.post<any>('/writer/switch-role').pipe(
      tap(res => {
        if (res.access_token) {
          localStorage.setItem(ACCESS_KEY, res.access_token);
          localStorage.setItem(REFRESH_KEY, res.refresh_token);
          this._user.update(u => u ? { ...u, role: 'writer' } : u);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  updateCoins(delta: number): void {
    this._user.update(u => u ? { ...u, coins: u.coins + delta } : u);
  }

  private saveTokens(res: TokenResponse): void {
    localStorage.setItem(ACCESS_KEY, res.access_token);
    localStorage.setItem(REFRESH_KEY, res.refresh_token);
  }
}
