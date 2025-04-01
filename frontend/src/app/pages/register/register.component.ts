import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if already logged in
    this.authService.isAuthenticated$.subscribe((isAuth: boolean) => {
      if (isAuth) {
        this.router.navigate(['/profile']);
      }
    });
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { firstName, lastName, email, password } = this.registerForm.value;
      
      // Include password directly in the user object
      const user = {
        firstName,
        lastName,
        email,
        password
      };
      
      this.authService.register(user).subscribe({
        next: (response) => {
          this.isLoading = false;
          // After successful registration, navigate to login
          this.router.navigate(['/login'], { 
            queryParams: { 
              registered: 'true',
              email: email 
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Registration error:', err);
          // Handle different types of error responses
          if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
          } else if (err.status === 0) {
            this.errorMessage = 'Cannot connect to the server. Please try again later.';
          } else {
            this.errorMessage = err.message || 'Registration failed. Please try again.';
          }
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
