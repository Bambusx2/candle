import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('API URL:', this.apiUrl);
  }

  /**
   * Get request
   * @param endpoint - API endpoint
   * @param requiresAuth - Whether the request requires authentication (kept for backwards compatibility)
   */
  get<T>(endpoint: string, requiresAuth: boolean = false): Observable<T> {
    const url = this.buildUrl(endpoint);
    console.log('GET request to:', url);
    return this.http.get<T>(url, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    })
    .pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get request with query parameters
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @param requiresAuth - Whether the request requires authentication (kept for backwards compatibility)
   */
  getWithParams<T>(endpoint: string, params: any, requiresAuth: boolean = false): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpParams = this.convertToHttpParams(params);
    console.log('GET request with params to:', url, params);
    
    return this.http.get<T>(url, { 
      params: httpParams,
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    })
    .pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Post request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication (kept for backwards compatibility)
   */
  post<T>(endpoint: string, body: any, requiresAuth: boolean = false): Observable<T> {
    const url = this.buildUrl(endpoint);
    console.log('POST request to:', url);
    return this.http.post<T>(url, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    })
    .pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Put request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication (kept for backwards compatibility)
   */
  put<T>(endpoint: string, body: any, requiresAuth: boolean = false): Observable<T> {
    const url = this.buildUrl(endpoint);
    console.log('PUT request to:', url);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    return this.http.put<T>(url, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    })
    .pipe(
      tap(response => console.log('PUT response received:', JSON.stringify(response, null, 2))),
      catchError(this.handleError)
    );
  }

  /**
   * Delete request
   * @param endpoint - API endpoint
   * @param requiresAuth - Whether the request requires authentication (kept for backwards compatibility)
   */
  delete<T>(endpoint: string, requiresAuth: boolean = false): Observable<T> {
    const url = this.buildUrl(endpoint);
    console.log('DELETE request to:', url);
    return this.http.delete<T>(url, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    })
    .pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Properly builds the URL to prevent double slashes
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash from endpoint if it exists
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Ensure proper URL construction
    let finalUrl;
    if (this.apiUrl.endsWith('/')) {
      finalUrl = `${this.apiUrl}${cleanEndpoint}`;
    } else {
      finalUrl = `${this.apiUrl}/${cleanEndpoint}`;
    }
    
    console.log(`buildUrl: endpoint "${endpoint}" → "${finalUrl}"`);
    return finalUrl;
  }

  /**
   * Convert object to HttpParams
   */
  private convertToHttpParams(params: any = {}): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return httpParams;
  }

  /**
   * Global error handler
   */
  private handleError(error: any) {
    // For 401 errors when accessing protected resources, these are expected when users aren't logged in
    // No logging for any 401 errors to keep console clean
    if (error.status === 401) {
      // No console logging for 401 errors at all - these are expected
      return throwError(() => error);
    }
    
    // Handle other errors normally
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      console.error(errorMessage);
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.error('Server error response:', error);
      console.error(errorMessage);
    }
    
    return throwError(() => error);
  }
} 