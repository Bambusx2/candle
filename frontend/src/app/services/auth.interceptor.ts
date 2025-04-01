import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  
  // Get the auth token from AuthService
  const token = authService.getToken();
  
  // Log detailed request information for debugging
  console.log(`[Auth Interceptor] ${req.method} request to: ${req.url}`);
  console.log(`[Auth Interceptor] Headers: ${req.headers.keys().join(', ')}`);
  
  // Add token if available
  if (token) {
    console.log('[Auth Interceptor] Token found, adding Authorization header');
    
    // Clone the request and add the authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    console.log(`[Auth Interceptor] Added Authorization header with Bearer token (first 10 chars): ${token.substring(0, 10)}...`);
    console.log(`[Auth Interceptor] Final request headers: ${authReq.headers.keys().join(', ')}`);
    
    return next(authReq);
  } else {
    console.log('[Auth Interceptor] No token found, proceeding without Authorization header');
  }
  
  // Forward the original request if there's no token
  return next(req);
}; 