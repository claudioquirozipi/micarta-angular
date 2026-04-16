import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, User } from '../../shared/models/user.model';

const TOKEN_KEY = 'micarta_token';
const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { email: string; name: string; password: string }) {
    return this.http.post<AuthResponse>(`${API}/auth/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(data: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${API}/auth/login`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  loginWithGoogle() {
    window.location.href = `${API}/auth/google`;
  }

  handleGoogleCallback(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    return this.http.get<User>(`${API}/users/me`).pipe(
      tap(user => this._user.set(user))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this._user.set(res.user);
  }

  private loadUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.sub, email: payload.email } as User;
    } catch {
      return null;
    }
  }
}
