import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  public isAuthenticated$: Observable<boolean>;
  public currentUser$: Observable<any>;
  
  private TOKEN_KEY = 'auth-token';
  private USER_KEY = 'auth-user';

  constructor(private apiService: ApiService) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
    this.isAuthenticated$ = this.currentUser.pipe(
      map(user => !!user)
    );
    this.currentUser$ = this.currentUser;
    
    // Log authentication status on startup
    console.log('Auth service initialized, user authenticated:', this.isLoggedIn());
    if (this.isLoggedIn()) {
      console.log('Token exists:', !!this.getToken());
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginCredentials | string, password?: string): Observable<LoginResponse> {
    let loginData: any;
    
    if (typeof credentials === 'string' && password) {
      loginData = { email: credentials, password };
    } else {
      loginData = credentials;
    }
    
    console.log('Attempting login with:', { email: loginData.email, hasPassword: !!loginData.password });
    
    return this.apiService.post<LoginResponse>('auth/login', loginData).pipe(
      tap((res: LoginResponse) => {
        console.log('Login successful, saving token and user data');
        this.saveToken(res.token);
        this.saveUser(res);
        this.currentUserSubject.next(res);
      })
    );
  }

  register(user: any, password?: string): Observable<any> {
    let userData: any;
    
    if (password) {
      userData = { ...user, password };
    } else {
      userData = user;
    }
    
    return this.apiService.post('auth/register', userData);
  }

  logout(): void {
    console.log('Logging out, removing token and user data');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    console.log('Retrieved token from localStorage (first 10 chars):', token.substring(0, 10) + '...');
    return token;
  }

  saveToken(token: string): void {
    console.log('Saving token to localStorage (first 10 chars):', token.substring(0, 10) + '...');
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  saveUser(user: any): void {
    console.log('Saving user data to localStorage');
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUserFromStorage(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user && user.roles && user.roles.includes('ROLE_ADMIN');
  }

  getUserProfile(): Observable<any> {
    const token = this.getToken();
    console.log('Fetching user profile, authenticated:', this.isLoggedIn());
    console.log('Token present for profile request:', !!token);
    return this.apiService.get('users/profile', true);
  }

  updateUserProfile(userData: any): Observable<any> {
    const token = this.getToken();
    console.log('Updating user profile with data:', JSON.stringify(userData, null, 2));
    console.log('Authentication status:', this.isLoggedIn());
    console.log('Token present for update request:', !!token);
    if (token) {
      console.log('Token (first 10 chars):', token.substring(0, 10) + '...');
    }
    
    // Call the API service to update the user profile
    return this.apiService.put('users/profile', userData, true).pipe(
      tap(response => {
        console.log('Profile update successful, updating stored user data');
        // Update the stored user data
        const currentUser = this.getUserFromStorage();
        if (currentUser) {
          // Use Object.assign instead of spread to avoid type issues
          const updatedUser = Object.assign({}, currentUser, response);
          this.saveUser(updatedUser);
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  changePassword(passwordData: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.apiService.post('users/change-password', passwordData, true);
  }
}
