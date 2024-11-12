import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'https://api.bolttimeline.masondigi.com/api';

  constructor(private http: HttpClient) {}

  getTasks(token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    console.log('Sending request with headers:', headers);
    return this.http.get(`${this.apiUrl}/tasks`, { headers }).pipe(
      tap((response) => console.log('Received response:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    throw error;
  }
}
