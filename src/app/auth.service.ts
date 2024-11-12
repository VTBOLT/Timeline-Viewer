import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://api.bolttimeline.masondigi.com/api';
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login() {
    window.location.href = `${this.apiUrl}/login`;
  }

  handleCallback(token: string): void {
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      console.log('Stored access token:', token);
    } else {
      console.error('No access token in URL');
    }
  }

  getAccessToken(): Observable<string | null> {
    const token = localStorage.getItem(this.tokenKey);
    console.log('Retrieved token from storage:', token);
    return of(token);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }
}
