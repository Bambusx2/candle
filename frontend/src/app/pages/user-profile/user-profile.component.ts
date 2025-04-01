import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../models/user';
import { Order, OrderStatus } from '../../models/order';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { OrderDetailsModalComponent } from '../../shared/order-details-modal/order-details-modal.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, OrderDetailsModalComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  addressForm: FormGroup;
  activeTab: 'profile' | 'orders' | 'address' = 'profile';
  isLoading: boolean = false;
  isLoadingOrders: boolean = false;
  isSaving: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  orderHistory: Order[] = [];
  orderError: string = '';
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    // Initialize forms with empty values, will be populated in ngOnInit
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]+$/)]]
    });
    
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9\-\s]+$/)]],
      country: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    
    this.authService.currentUser.subscribe((user: any) => {
      this.user = user;
      
      if (user) {
        console.log('Loaded user data:', user);
        
        // Populate profile form
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || ''
        });
        
        // Populate address form if address exists
        if (user.address) {
          console.log('User has address data:', user.address);
          this.addressForm.patchValue({
            street: user.address.street || '',
            city: user.address.city || '',
            state: user.address.state || '',
            postalCode: user.address.postalCode || '',
            country: user.address.country || ''
          });
        } else {
          console.log('No address data found for user');
        }
      } else {
        // Redirect to login if not authenticated
        this.router.navigate(['/login']);
      }
      
      this.isLoading = false;
    });

    // Load user order history
    this.loadOrderHistory();
  }

  setActiveTab(tab: 'profile' | 'orders' | 'address'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Load orders when the orders tab is selected
    if (tab === 'orders' && this.orderHistory.length === 0) {
      this.loadOrderHistory();
    }
  }

  loadOrderHistory(): void {
    this.isLoadingOrders = true;
    this.orderError = '';
    
    this.orderService.getOrderHistory().subscribe({
      next: (orders) => {
        this.orderHistory = orders;
        this.isLoadingOrders = false;
      },
      error: (error) => {
        console.error('Error loading order history:', error);
        this.orderError = 'Failed to load order history. Please try again later.';
        this.isLoadingOrders = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.valid && this.user) {
      this.isSaving = true;
      this.successMessage = '';
      this.errorMessage = '';
      
      const updatedUser: Partial<User> = {
        ...this.user,
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        phoneNumber: this.profileForm.value.phoneNumber
      };
      
      this.authService.updateUserProfile(updatedUser).subscribe({
        next: (user) => {
          this.user = user;
          this.isSaving = false;
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.message || 'Failed to update profile. Please try again.';
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  saveAddress(): void {
    if (this.addressForm.valid && this.user) {
      this.isSaving = true;
      this.successMessage = '';
      this.errorMessage = '';
      
      // Format the data to match the backend's UpdateUserRequest structure
      const updateRequest = {
        // Include these to maintain existing user data
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phoneNumber: this.user.phoneNumber,
        // Add the address data in the format expected by the backend
        address: {
          street: this.addressForm.value.street,
          city: this.addressForm.value.city,
          state: this.addressForm.value.state,
          postalCode: this.addressForm.value.postalCode,
          country: this.addressForm.value.country,
          isDefault: true, // Make this the default address
          addressType: 'SHIPPING'
        }
      };
      
      console.log('Sending address update request:', updateRequest);
      
      this.authService.updateUserProfile(updateRequest).subscribe({
        next: (user) => {
          this.user = user;
          this.isSaving = false;
          this.successMessage = 'Address updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err.message || 'Failed to update address. Please try again.';
          console.error('Error updating address:', err);
        }
      });
    } else {
      this.addressForm.markAllAsTouched();
    }
  }

  viewOrderDetails(orderId: string | number): void {
    // Convert to number if it's a string
    const orderIdNumber = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
    const order = this.orderHistory.find(order => order.id === orderIdNumber);
    if (order) {
      this.selectedOrder = order;
      this.showOrderDetails = true;
    }
  }

  trackOrder(orderId: string | number): void {
    // Convert to number if it's a string
    const orderIdNumber = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
    const order = this.orderHistory.find(order => order.id === orderIdNumber);
    if (order?.trackingNumber) {
      // In a real application, you would redirect to a tracking page
      // or open the carrier's tracking website
      alert(`Tracking order ${orderId} with tracking number ${order.trackingNumber}`);
    } else {
      alert('Tracking information not available yet');
    }
  }

  getOrderStatusClass(status: string): string {
    return status.toLowerCase();
  }

  logout(): void {
    this.authService.logout();
    this.cartService.clearCart();
    this.router.navigate(['/login']);
  }

  // Close order details modal
  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }
}
